import { jest, describe, it, expect } from '@jest/globals';

const mockCreateCheckoutSession = jest.fn();
const mockCreatePixCheckoutSession = jest.fn();
const mockHandleWebhook = jest.fn();
const mockCreatePortalSession = jest.fn();
const mockGetSubscription = jest.fn();
const mockAuthMiddleware = jest.fn((req, res, next) => next());

jest.unstable_mockModule('../../../src/controllers/paymentController.js', () => ({
  createCheckoutSession: mockCreateCheckoutSession,
  createPixCheckoutSession: mockCreatePixCheckoutSession,
  handleWebhook: mockHandleWebhook,
  createPortalSession: mockCreatePortalSession,
  getSubscription: mockGetSubscription,
}));

jest.unstable_mockModule('../../../src/middlewares/authMiddleware.js', () => ({
  default: mockAuthMiddleware,
}));

const { default: router } = await import('../../../src/routes/paymentRoutes.js');

const getRouteHandlers = (path, method) => {
  const layer = router.stack.find(
    (entry) => entry.route?.path === path && entry.route.methods?.[method]
  );

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  return layer.route.stack.map((stackLayer) => stackLayer.handle);
};

describe('paymentRoutes', () => {
  it('requires auth middleware on GET /subscription', () => {
    const handlers = getRouteHandlers('/subscription', 'get');
    expect(handlers).toHaveLength(2);
    expect(handlers[0]).toBe(mockAuthMiddleware);
    expect(handlers[1]).toBe(mockGetSubscription);
  });

  it('requires auth middleware on POST /portal', () => {
    const handlers = getRouteHandlers('/portal', 'post');
    expect(handlers).toHaveLength(2);
    expect(handlers[0]).toBe(mockAuthMiddleware);
    expect(handlers[1]).toBe(mockCreatePortalSession);
  });

  it('keeps checkout and webhook routes public', () => {
    const checkoutHandlers = getRouteHandlers('/create-checkout-session', 'post');
    const pixHandlers = getRouteHandlers('/create-pix-session', 'post');
    const webhookHandlers = getRouteHandlers('/webhook', 'post');

    expect(checkoutHandlers).toEqual([mockCreateCheckoutSession]);
    expect(pixHandlers).toEqual([mockCreatePixCheckoutSession]);
    expect(webhookHandlers).toEqual([mockHandleWebhook]);
  });
});
