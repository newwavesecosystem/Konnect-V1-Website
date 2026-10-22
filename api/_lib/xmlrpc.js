/**
 * Phase 6 & Phase 10: Secure, Zero-Dependency XML-RPC 1.0 Serializer, Parser & Transport
 * Implements the officially documented Odoo 18 External API protocol (/xmlrpc/2/common & /xmlrpc/2/object).
 * Protects against XML entity injection by strictly escaping all dynamic values and rejecting DTD/ENTITY declarations.
 */

class OdooRpcError extends Error {
  constructor(message, { code = 'ODOO_RPC_ERROR', statusCode = 502, faultCode = null, isTimeout = false } = {}) {
    super(message);
    this.name = 'OdooRpcError';
    this.code = code;
    this.statusCode = statusCode;
    this.faultCode = faultCode;
    this.isTimeout = isTimeout;
  }
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unescapeXml(str) {
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function serializeValue(val) {
  if (val === null || val === undefined) {
    return '<value><nil/></value>';
  }
  if (typeof val === 'boolean') {
    return `<value><boolean>${val ? '1' : '0'}</boolean></value>`;
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      throw new Error('Cannot serialize non-finite number in XML-RPC');
    }
    if (Number.isInteger(val)) {
      return `<value><int>${val}</int></value>`;
    }
    return `<value><double>${val}</double></value>`;
  }
  if (typeof val === 'string') {
    return `<value><string>${escapeXml(val)}</string></value>`;
  }
  if (Array.isArray(val)) {
    const items = val.map((item) => serializeValue(item)).join('');
    return `<value><array><data>${items}</data></array></value>`;
  }
  if (typeof val === 'object') {
    const members = Object.entries(val)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `<member><name>${escapeXml(k)}</name>${serializeValue(v)}</member>`)
      .join('');
    return `<value><struct>${members}</struct></value>`;
  }
  return `<value><string>${escapeXml(String(val))}</string></value>`;
}

/**
 * Builds a complete XML-RPC `<methodCall>` request payload.
 */
function buildXmlRpcMethodCall(methodName, params = []) {
  if (!/^[a-zA-Z0-9_./-]+$/.test(methodName)) {
    throw new Error(`Invalid XML-RPC method name: ${methodName}`);
  }
  const serializedParams = params.map((p) => `<param>${serializeValue(p)}</param>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><methodCall><methodName>${escapeXml(
    methodName
  )}</methodName><params>${serializedParams}</params></methodCall>`;
}

/**
 * Recursive descent parser for XML-RPC `<methodResponse>` payloads.
 * Rejects DOCTYPE/ENTITY declarations to prevent XXE vulnerabilities.
 */
function parseXmlRpcResponse(xmlString) {
  if (typeof xmlString !== 'string' || !xmlString.trim()) {
    throw new OdooRpcError('Empty XML-RPC response from upstream Odoo server.', {
      code: 'ODOO_INVALID_RESPONSE',
      statusCode: 502,
    });
  }

  if (/<!DOCTYPE|<!ENTITY/i.test(xmlString)) {
    throw new OdooRpcError('Rejected XML-RPC response containing forbidden DOCTYPE/ENTITY declaration.', {
      code: 'ODOO_UNSAFE_XML',
      statusCode: 502,
    });
  }

  if (!/<methodResponse[\s>]/i.test(xmlString)) {
    throw new OdooRpcError('Malformed XML-RPC response: missing <methodResponse> root element.', {
      code: 'ODOO_INVALID_RESPONSE',
      statusCode: 502,
    });
  }

  // Tokenize XML tags and text nodes
  const tokens = [];
  const tagRegex = /<\/?([a-zA-Z0-9_:-]+)(\s[^>]*)?\/?>|([^<]+)/g;
  let match;
  while ((match = tagRegex.exec(xmlString)) !== null) {
    const full = match[0];
    if (full.startsWith('<?') || full.startsWith('<!--')) continue;
    if (match[1]) {
      const tagName = match[1].toLowerCase();
      const isClose = full.startsWith('</');
      const isSelfClosing = full.endsWith('/>');
      tokens.push({ type: 'tag', name: tagName, isClose, isSelfClosing });
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'text', value: match[3] });
    }
  }

  let cursor = 0;

  function peek() {
    return tokens[cursor];
  }

  function consume() {
    return tokens[cursor++];
  }

  function skipWhitespaceText() {
    while (peek() && peek().type === 'text' && peek().value.trim() === '') {
      consume();
    }
  }

  function readTextUntilClose(tagName) {
    let text = '';
    while (peek()) {
      const t = consume();
      if (t.type === 'tag' && t.isClose && t.name === tagName) {
        break;
      }
      if (t.type === 'text') {
        text += t.value;
      }
    }
    return unescapeXml(text);
  }

  function parseValue() {
    skipWhitespaceText();
    const openVal = consume();
    if (!openVal || openVal.type !== 'tag' || openVal.name !== 'value') {
      throw new OdooRpcError('Expected <value> element in XML-RPC response.', {
        code: 'ODOO_INVALID_RESPONSE',
      });
    }
    if (openVal.isSelfClosing) return '';

    // In XML-RPC, <value>plain text</value> without inner type tag is a string
    const next = peek();
    if (!next) return '';
    if (next.type === 'text' && next.value.trim() !== '') {
      const txt = readTextUntilClose('value');
      return txt;
    }

    skipWhitespaceText();
    const inner = consume();
    if (!inner) return '';
    if (inner.type === 'tag' && inner.isClose && inner.name === 'value') {
      return '';
    }

    let result;
    if (inner.type === 'tag') {
      switch (inner.name) {
        case 'string':
          result = inner.isSelfClosing ? '' : readTextUntilClose('string');
          break;
        case 'int':
        case 'i4':
        case 'i8':
          result = inner.isSelfClosing ? 0 : parseInt(readTextUntilClose(inner.name).trim(), 10);
          break;
        case 'double':
          result = inner.isSelfClosing ? 0.0 : parseFloat(readTextUntilClose('double').trim());
          break;
        case 'boolean': {
          const rawBool = inner.isSelfClosing ? '0' : readTextUntilClose('boolean').trim();
          result = rawBool === '1' || rawBool.toLowerCase() === 'true';
          break;
        }
        case 'nil':
          if (!inner.isSelfClosing) readTextUntilClose('nil');
          result = null;
          break;
        case 'array':
          result = parseArray(inner.isSelfClosing);
          break;
        case 'struct':
          result = parseStruct(inner.isSelfClosing);
          break;
        default:
          result = inner.isSelfClosing ? '' : readTextUntilClose(inner.name);
          break;
      }
    }

    // Consume closing </value>
    skipWhitespaceText();
    if (peek() && peek().type === 'tag' && peek().isClose && peek().name === 'value') {
      consume();
    }
    return result;
  }

  function parseArray(isSelfClosing) {
    if (isSelfClosing) return [];
    const arr = [];
    skipWhitespaceText();
    if (peek() && peek().type === 'tag' && peek().name === 'data') {
      const dataTag = consume();
      if (!dataTag.isSelfClosing) {
        skipWhitespaceText();
        while (peek() && !(peek().type === 'tag' && peek().isClose && peek().name === 'data')) {
          if (peek().type === 'tag' && peek().name === 'value') {
            arr.push(parseValue());
          } else {
            consume();
          }
          skipWhitespaceText();
        }
        if (peek() && peek().type === 'tag' && peek().isClose && peek().name === 'data') {
          consume();
        }
      }
    }
    skipWhitespaceText();
    if (peek() && peek().type === 'tag' && peek().isClose && peek().name === 'array') {
      consume();
    }
    return arr;
  }

  function parseStruct(isSelfClosing) {
    if (isSelfClosing) return {};
    const obj = {};
    skipWhitespaceText();
    while (peek() && !(peek().type === 'tag' && peek().isClose && peek().name === 'struct')) {
      const t = peek();
      if (t.type === 'tag' && t.name === 'member' && !t.isClose) {
        consume(); // <member>
        let memberName = '';
        let memberValue = undefined;
        skipWhitespaceText();
        while (peek() && !(peek().type === 'tag' && peek().isClose && peek().name === 'member')) {
          const mt = peek();
          if (mt.type === 'tag' && mt.name === 'name' && !mt.isClose) {
            consume();
            memberName = mt.isSelfClosing ? '' : readTextUntilClose('name');
          } else if (mt.type === 'tag' && mt.name === 'value' && !mt.isClose) {
            memberValue = parseValue();
          } else {
            consume();
          }
          skipWhitespaceText();
        }
        if (peek() && peek().type === 'tag' && peek().isClose && peek().name === 'member') {
          consume();
        }
        if (memberName) {
          obj[memberName] = memberValue;
        }
      } else {
        consume();
      }
      skipWhitespaceText();
    }
    if (peek() && peek().type === 'tag' && peek().isClose && peek().name === 'struct') {
      consume();
    }
    return obj;
  }

  // Find <fault> or <params>
  while (peek()) {
    const t = consume();
    if (t.type === 'tag' && !t.isClose && t.name === 'fault') {
      const faultStruct = parseValue();
      const faultCode = faultStruct?.faultCode ?? null;
      const faultString = faultStruct?.faultString || 'Odoo XML-RPC Fault';
      const isAccessDenied = /access denied|accesserror|not allowed|permission/i.test(String(faultString));
      throw new OdooRpcError(`Odoo XML-RPC Fault: ${faultString}`, {
        code: isAccessDenied ? 'ODOO_PERMISSION_DENIED' : 'ODOO_XMLRPC_FAULT',
        statusCode: isAccessDenied ? 403 : 502,
        faultCode,
      });
    }
    if (t.type === 'tag' && !t.isClose && t.name === 'param') {
      return parseValue();
    }
  }

  throw new OdooRpcError('Malformed XML-RPC response: no <param> or <fault> found.', {
    code: 'ODOO_INVALID_RESPONSE',
    statusCode: 502,
  });
}

/**
 * Performs an HTTP POST XML-RPC call with timeout enforcement.
 */
async function callXmlRpc(endpointUrl, methodName, params = [], { timeoutMs = 10000, fetchImpl = global.fetch } = {}) {
  const xmlBody = buildXmlRpcMethodCall(methodName, params);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        Accept: 'text/xml',
        'User-Agent': 'Konn3ct-Odoo18-Integration/1.0',
      },
      body: xmlBody,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new OdooRpcError(`Odoo XML-RPC endpoint returned HTTP ${response.status}`, {
        code: 'ODOO_HTTP_ERROR',
        statusCode: response.status >= 500 ? 502 : response.status,
      });
    }

    const responseText = await response.text();
    return parseXmlRpcResponse(responseText);
  } catch (err) {
    if (err instanceof OdooRpcError) {
      throw err;
    }
    if (err.name === 'AbortError' || /aborted|timeout/i.test(err.message)) {
      throw new OdooRpcError(`Odoo XML-RPC request timed out after ${timeoutMs}ms`, {
        code: 'ODOO_TIMEOUT',
        statusCode: 504,
        isTimeout: true,
      });
    }
    throw new OdooRpcError(`Failed to reach Odoo XML-RPC endpoint: ${err.message}`, {
      code: 'ODOO_NETWORK_ERROR',
      statusCode: 503,
    });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  OdooRpcError,
  escapeXml,
  unescapeXml,
  serializeValue,
  buildXmlRpcMethodCall,
  parseXmlRpcResponse,
  callXmlRpc,
};
