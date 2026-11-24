import {
  buildDataTableMarkup,
  buildFormMarkup,
  inferColumns,
} from './buildPageContent.js';

describe('page content builders', () => {
  test('builds a stable visitor-submission form', () => {
    const html = buildFormMarkup({
      resource: 'appointments',
      fields: [
        { name: 'name', label: 'Your name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'message', label: 'Message', type: 'textarea' },
      ],
      submitText: 'Book now',
      successMessage: 'Appointment requested.',
    });

    expect(html).toContain('data-form="appointments"');
    expect(html).toContain('name="name" required');
    expect(html).toContain('type="email" name="email"');
    expect(html).toContain('<textarea name="message"');
    expect(html).toContain('name="website"');
    expect(html).toContain('data-form-status');
    expect(html).toContain('Book now');
  });

  test('rejects invalid field names without corrupting generated markup', () => {
    const html = buildFormMarkup({
      resource: 'leads',
      fields: [
        { name: 'fullName', type: 'text' },
        { name: 'status onclick=alert(1)', type: 'text' },
      ],
    });

    expect(html).toContain('name="fullName"');
    expect(html).not.toContain('onclick');
  });

  test('infers safe display columns and excludes system data', () => {
    expect(
      inferColumns([
        {
          id: 1,
          productId: 2,
          name: 'Desk',
          price: 100,
          imageUrl: '/uploads/desk.jpg',
          password: 'secret',
          createdAt: '2026-01-01',
        },
      ]),
    ).toEqual([
      expect.objectContaining({ key: 'name', type: 'text' }),
      expect.objectContaining({ key: 'price', format: 'currency' }),
      expect.objectContaining({ key: 'imageUrl', type: 'image' }),
    ]);
  });

  test('builds hydration placeholders without current records', () => {
    const html = buildDataTableMarkup({
      resource: 'products',
      columns: [{ key: 'name', label: 'Product' }],
      emptyText: 'No products.',
    });

    expect(html).toContain('data-entity="products"');
    expect(html).toContain('data-empty-text="No products."');
    expect(html).toContain('data-row');
    expect(html).toContain('data-field="name"');
  });
});
