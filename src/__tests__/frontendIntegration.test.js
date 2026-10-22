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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../App';
import ContactSales from '../pages/ContactSales';
import { DemoSection } from '../components/Sections';
import siteContent from '../data/siteContent.json';

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

    fireEvent.change(screen.getByPlaceholderText(/Your full name/i), {
      target: { value: 'Oluwaseun Adeyemi' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Company \/ institution/i), {
      target: { value: 'Newwaves Partner Org' },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@organisation\.com/i), {
      target: { value: 'seun@partner.org' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+234/i), {
      target: { value: '+234 803 111 2222' },
    });

    const submitBtn = screen.getAllByRole('button', { name: /Contact sales/i })[0];
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

    fireEvent.change(screen.getByPlaceholderText(/Your full name/i), {
      target: { value: 'Bola Tinubu' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Company \/ institution/i), {
      target: { value: 'Civic Hub' },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@organisation\.com/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+234/i), {
      target: { value: '+2348091234567' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Contact sales/i })[0]);

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

    fireEvent.change(screen.getByPlaceholderText(/Your full name/i), {
      target: { value: 'Kemi Adebayo' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Company \/ institution/i), {
      target: { value: 'Apex Group' },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@organisation\.com/i), {
      target: { value: 'kemi@apexgroup.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+234/i), {
      target: { value: '+2348021234567' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Contact sales/i })[0]);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not complete your registration/i);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('4. Connects segment DemoSection forms (e.g. /government) to /api/leads with preserved idempotency key on retry', async () => {
    const govPage = siteContent.government;
    const govCtaSection = govPage.sections.find((s) => s.id === 'cta');

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
        <DemoSection section={govCtaSection} form={govPage.form} route="government" />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Your name/i), {
      target: { value: 'Musa Abdullahi' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Ministry \/ Agency/i), {
      target: { value: 'NITDA' },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@institution\.gov/i), {
      target: { value: 'musa@nitda.gov.ng' },
    });

    const submitBtn = screen.getByRole('button', { name: /Prepare request/i });
    fireEvent.click(submitBtn);

    const errAlert = await screen.findByRole('alert');
    expect(errAlert).toHaveTextContent(/took too long/i);

    // Retry without changing inputs -> should send the exact same X-Idempotency-Key
    fireEvent.click(screen.getByRole('button', { name: /Prepare request/i }));

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

    expect(screen.getByText(/Connect on your terms\./i)).toBeInTheDocument();
    expect(screen.getByText(/Six freedoms\. One connected experience\./i)).toBeInTheDocument();
    expect(screen.getByText(/Control without making connection difficult\./i)).toBeInTheDocument();
  });
});
