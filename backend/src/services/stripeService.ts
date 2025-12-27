import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
});

// Job posting pricing in Czech Crowns (Kč)
export const JOB_PRICING = {
  FREE: { price: 0, duration: 7, name: 'Free (7 days)' },
  STANDARD: { price: 4990, duration: 30, name: 'Standard (30 days)' },
  FEATURED: { price: 9990, duration: 30, name: 'Featured (30 days)' },
  PREMIUM: { price: 14990, duration: 60, name: 'Premium (60 days)' },
};

// Company subscription pricing
export const SUBSCRIPTION_PRICING = {
  FREE: { price: 0, jobs: 1, cvViews: 5, name: 'Free' },
  PROFESSIONAL: { price: 7990, jobs: 5, cvViews: 20, name: 'Professional' },
  ENTERPRISE: { price: 24990, jobs: -1, cvViews: -1, name: 'Enterprise' }, // -1 = unlimited
};

/**
 * Create a payment intent for job posting
 */
export async function createJobPaymentIntent(
  jobId: string,
  tier: keyof typeof JOB_PRICING,
  companyId: string
): Promise<Stripe.PaymentIntent> {
  const pricing = JOB_PRICING[tier];

  if (pricing.price === 0) {
    throw new Error('Free tier does not require payment');
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: pricing.price * 100, // Convert to haléře (cents)
    currency: 'czk',
    metadata: {
      type: 'job_posting',
      jobId,
      companyId,
      tier,
    },
    description: `Job posting: ${pricing.name}`,
  });

  return paymentIntent;
}

/**
 * Create a subscription for company
 */
export async function createSubscription(
  companyId: string,
  plan: keyof typeof SUBSCRIPTION_PRICING,
  customerId?: string
): Promise<Stripe.Subscription> {
  const pricing = SUBSCRIPTION_PRICING[plan];

  if (pricing.price === 0) {
    throw new Error('Free plan does not require payment');
  }

  // Create or retrieve customer
  let customer: Stripe.Customer;
  if (customerId) {
    customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  } else {
    customer = await stripe.customers.create({
      metadata: {
        companyId,
      },
    });
  }

  // Create price if not exists (you'd normally do this once in Stripe dashboard)
  const price = await stripe.prices.create({
    unit_amount: pricing.price * 100,
    currency: 'czk',
    recurring: { interval: 'month' },
    product_data: {
      name: `${pricing.name} Subscription`,
    },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    metadata: {
      companyId,
      plan,
    },
  });

  return subscription;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Retrieve payment intent
 */
export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Retrieve subscription
 */
export async function retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Create a checkout session for job posting
 */
export async function createCheckoutSession(
  jobId: string,
  tier: keyof typeof JOB_PRICING,
  companyId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const pricing = JOB_PRICING[tier];

  if (pricing.price === 0) {
    throw new Error('Free tier does not require payment');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'czk',
          product_data: {
            name: `Job Posting - ${pricing.name}`,
            description: `Post your job for ${pricing.duration} days`,
          },
          unit_amount: pricing.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type: 'job_posting',
      jobId,
      companyId,
      tier,
    },
  });

  return session;
}

export default stripe;
