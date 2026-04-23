import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockSubscriptionFindOne = jest.fn();
const mockPortalSessionCreate = jest.fn();
const mockStripeConstructor = jest.fn(() => ({
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: mockPortalSessionCreate } },
  webhooks: { constructEvent: jest.fn() },
}));

jest.unstable_mockModule('stripe', () => ({
  default: mockStripeConstructor,
}));

jest.unstable_mockModule('../../../src/db/models/index.js', () => ({
  Subscription: {
    findOne: mockSubscriptionFindOne,
    update: jest.fn(),
    upsert: jest.fn(),
    create: jest.fn(),
  },
  PendingStudent: {
    upsert: jest.fn(),
    findOne: jest.fn(),
  },
  Student: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/services/hashService.js', () => ({
  hashPassword: jest.fn(),
}));

const {
  createPortalSession,
  getSubscription,
} = await import('../../../src/controllers/paymentController.js');

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('paymentController authz safeguards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 on createPortalSession when authenticated email is missing', async () => {
    const req = { user: {} };
    const res = makeRes();

    await createPortalSession(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuario nao autenticado.' });
    expect(mockSubscriptionFindOne).not.toHaveBeenCalled();
  });

  it('uses req.user.email (not body email) when creating portal session', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ stripe_customer_id: 'cus_123' });
    mockPortalSessionCreate.mockResolvedValue({ url: 'https://billing.example/portal' });

    const req = {
      user: { email: 'real-user@vestweb.com' },
      body: { email: 'attacker@evil.com' },
    };
    const res = makeRes();

    await createPortalSession(req, res);

    expect(mockSubscriptionFindOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        customer_email: 'real-user@vestweb.com',
      }),
      order: [['created_at', 'DESC']],
    }));
    expect(mockPortalSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_123',
    }));
    expect(res.json).toHaveBeenCalledWith({ url: 'https://billing.example/portal' });
  });

  it('returns 401 on getSubscription when authenticated email is missing', async () => {
    const req = { user: null, query: { email: 'someone@x.com' } };
    const res = makeRes();

    await getSubscription(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuario nao autenticado.' });
    expect(mockSubscriptionFindOne).not.toHaveBeenCalled();
  });

  it('uses req.user.email (not query email) on getSubscription', async () => {
    const subscription = { id: 99, customer_email: 'real-user@vestweb.com' };
    mockSubscriptionFindOne.mockResolvedValue(subscription);

    const req = {
      user: { email: 'real-user@vestweb.com' },
      query: { email: 'attacker@evil.com' },
    };
    const res = makeRes();

    await getSubscription(req, res);

    expect(mockSubscriptionFindOne).toHaveBeenCalledWith({
      where: { customer_email: 'real-user@vestweb.com' },
      order: [['created_at', 'DESC']],
    });
    expect(res.json).toHaveBeenCalledWith({ subscription });
  });
});
