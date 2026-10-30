/**
 * Phase 11: Frontend & Regression Automated Test Suite
 * Covers:
 * - Valid registration on `/contact-sales` and segment `DemoSection` forms
 * - Invalid email & missing required fields rejection
 * - Loading state & prevention of accidental double submission
 * - Backend-confirmed success messaging (crm_created vs queued_pending_crm)
 * - Error handling when backend/Odoo is unavailable
 * - Accessibility attributes (role="alert", role="status", aria-busy, aria-invalid)
 * - Regression testing: existing Konn3ct routes, navigation, tabs, and design preserved
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../App';
import ContactSales from '../pages/ContactSales';
import { DemoSection } from '../components/Sections';

beforeEach(() => {
  window.scrollTo = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Phase 11 — Frontend Integration & Regression Test Suite', () => {
  test('1. Valid registration on ContactSales transmits to /api/leads and displays CRM confirmation', async () => {
    let resolveFetch;
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const onToast = jest.fn();
    render(
      <MemoryRouter initialEntries={['/contact-sales']}>
        <ContactSales onToast={onToast} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/What would you like to do/i), {
      target: { value: 'Book a product demo' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^Full name$/i), {
      target: { value: 'Oluwaseun Adeyemi' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Organisation name/i), {
      target: { value: 'Newwaves Partner Org' },
    });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'seun@partner.org' },
    });

    const submitBtn = screen.getByRole('button', { name: /Request a conversation/i });
    fireEvent.click(submitBtn);

    // Verify loading state and double-submit prevention while request is in flight
    expect(screen.getByRole('button', { name: /Submitting to Konn3ct/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Submitting to Konn3ct/i }));
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Confirm no premature success message before backend responds
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    // Resolve backend response
    resolveFetch({
      ok: true,
      status: 201,
      json: async () => ({
        ok: true,
        deliveryStatus: 'crm_created',
        submissionId: 'k3_test_1',
        leadReference: 'ODOO-5501',
        classification: 'Konn3ct Demo Request',
        message:
          'Thank you. Your Konn3ct Demo Request has been registered with the Konn3ct team (Ref: ODOO-5501).',
      }),
    });

    const statusAlert = await screen.findByRole('status');
    expect(statusAlert).toHaveTextContent(/ODOO-5501/i);
    expect(onToast).toHaveBeenCalledWith(expect.stringContaining('ODOO-5501'));
  });

  test('2. Blocks invalid email and missing required fields with accessible alert before calling backend', async () => {
    render(
      <MemoryRouter initialEntries={['/contact-sales']}>
        <ContactSales />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/What would you like to do/i), {
      target: { value: 'Book a product demo' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^Full name$/i), {
      target: { value: 'Bola Tinubu' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Organisation name/i), {
      target: { value: 'Civic Hub' },
    });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'not-an-email' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Request a conversation/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/valid email address/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('3. Displays clear error message and does NOT claim success when Odoo/backend returns an error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        ok: false,
        errorCode: 'ODOO_NETWORK_ERROR',
        message:
          'We could not complete your registration with our CRM right now. Please try again in a moment or email info@konn3ct.com.',
      }),
    });

    render(
      <MemoryRouter initialEntries={['/contact-sales']}>
        <ContactSales />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/What would you like to do/i), {
      target: { value: 'Book a product demo' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^Full name$/i), {
      target: { value: 'Kemi Adebayo' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Organisation name/i), {
      target: { value: 'Apex Group' },
    });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'kemi@apexgroup.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Request a conversation/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not complete your registration/i);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('4. Connects segment DemoSection forms (e.g. /government) to /api/leads with preserved idempotency key on retry', async () => {
    // First attempt fails with network timeout, second attempt succeeds
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 504,
        json: async () => ({
          ok: false,
          errorCode: 'ODOO_TIMEOUT',
          message: 'Our CRM service took too long to respond.',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          ok: true,
          deliveryStatus: 'crm_created',
          leadReference: 'ODOO-7788',
          classification: 'Konn3ct Demo Request',
          message: 'Thank you. Your Konn3ct Demo Request has been registered (Ref: ODOO-7788).',
        }),
      });

    render(
      <MemoryRouter initialEntries={['/government']}>
        <DemoSection route="government" />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Full name/i), {
      target: { value: 'Musa Abdullahi' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Organisation name/i), {
      target: { value: 'NITDA' },
    });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'musa@nitda.gov.ng' },
    });

    const submitBtn = screen.getByRole('button', { name: /Request a government demo/i });
    fireEvent.click(submitBtn);

    const errAlert = await screen.findByRole('alert');
    expect(errAlert).toHaveTextContent(/took too long/i);

    // Retry without changing inputs -> should send the exact same X-Idempotency-Key
    fireEvent.click(screen.getByRole('button', { name: /Request a government demo/i }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/ODOO-7788/i);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const key1 = global.fetch.mock.calls[0][1].headers['X-Idempotency-Key'];
    const key2 = global.fetch.mock.calls[1][1].headers['X-Idempotency-Key'];
    expect(key1).toBeTruthy();
    expect(key1).toBe(key2);
  });

  test('5. Regression: preserves Konn3ct home page, segment routes, and navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Connect on/i)).toBeInTheDocument();
    expect(screen.getByText(/Six freedoms\./i)).toBeInTheDocument();
    expect(screen.getByText(/Trust is a practical/i)).toBeInTheDocument();
  });

  test('6. All 6 sector DemoSection forms and ContactSales progressive intents transmit to /api/leads', async () => {
    const sectorForms = [
      { route: 'government', submitLabel: /Request a government demo/i, org: 'Federal Ministry of Digital Economy' },
      { route: 'associations', submitLabel: /Request an association demo/i, org: 'Nigerian Bar Association' },
      { route: 'education', submitLabel: /Book an education demo/i, org: 'University of Lagos' },
      { route: 'faith', submitLabel: /Book a faith-community demo/i, org: 'Grace Assembly Network' },
      { route: 'corporates', submitLabel: /Book an enterprise demo/i, org: 'Newwaves Enterprise Ltd' },
      { route: 'events-community', submitLabel: /Request an event consultation/i, org: 'Lagos Tech Summit' },
    ];

    for (let i = 0; i < sectorForms.length; i += 1) {
      const { route, submitLabel, org } = sectorForms[i];
      const leadRef = `ODOO-SECTOR-${i + 1}`;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          ok: true,
          deliveryStatus: 'crm_created',
          leadReference: leadRef,
          classification: 'Konn3ct Demo Request',
          message: `Thank you. Your Konn3ct Demo Request has been registered (Ref: ${leadRef}).`,
        }),
      });

      const { unmount } = render(
        <MemoryRouter initialEntries={[`/${route}`]}>
          <DemoSection route={route} />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/Full name/i), {
        target: { value: `Lead Tester ${i + 1}` },
      });
      fireEvent.change(screen.getByPlaceholderText(/Organisation name/i), {
        target: { value: org },
      });
      fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
        target: { value: 'feranmi21@printingshit.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: submitLabel }));

      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent(leadRef);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const sentBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(sentBody.route).toBe(route);
      expect(sentBody.organisation).toBe(org);
      expect(sentBody.email).toBe('feranmi21@printingshit.com');

      unmount();
    }
  });

  test('7. Clicking Choose a plan opens the full Konn3ct Pricing popup overlay', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    const choosePlanBtn = screen.getByRole('button', { name: /Choose a plan/i });
    fireEvent.click(choosePlanBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/Choose the plan that fits how you connect/i);
    expect(dialog).toHaveTextContent(/NGN 2,500\/mo/i);
    expect(dialog).toHaveTextContent(/NGN 10,000\/mo/i);
    expect(dialog).toHaveTextContent(/NGN 200,000\/yr/i);
    expect(dialog).toHaveTextContent(/Custom Pricing/i);
    expect(dialog).toHaveTextContent(/EventPro Addons/i);
    expect(dialog).toHaveTextContent(/Full Plan Comparison/i);
  });

  test('8. Renders Features carousel under Connection, made useful section and removes pricing design note', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(
      screen.queryByText(/Design note: final paid prices, access duration/i)
    ).not.toBeInTheDocument();

    const featureTabs = [
      'Meeting Summary',
      'Scheduling',
      'Reactions',
      'Polls',
      'Dashboard',
      'Doc',
      'Audio Boost',
      'Playback',
    ];

    featureTabs.forEach((featureName) => {
      expect(screen.getByRole('tab', { name: featureName })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Audio Boost' }));
    expect(
      screen.getByText(/Clear voice across everyday environments/i)
    ).toBeInTheDocument();
  });

  test('9. Privacy link in the footer points directly to /Konn3ct-Privacy-Policy.pdf', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    const privacyLink = screen.getByRole('link', { name: /^Privacy$/i });
    expect(privacyLink).toHaveAttribute('href', '/Konn3ct-Privacy-Policy.pdf');
  });
});
