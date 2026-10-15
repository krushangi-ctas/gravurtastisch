const httpStatus = require('http-status');
const Stripe = require('stripe');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const PaymentModel = require('../models/payment.model');
const PlanModel = require('../models/plan.model');
const User = require('../models/user.model');
const emailService = require('./email.service');

const getStripe = () => {
  if (!config.stripe.secretKey) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Stripe is not configured. Set STRIPE_SECRET_KEY in the API .env.'
    );
  }
  return new Stripe(config.stripe.secretKey);
};

const getSellerPanelBaseUrl = () => {
  return (
    process.env.SELLER_PANEL_URL ||
    process.env.PANEL_URL ||
    config.seller_panel_url ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');
};

const getSellerPanelSignInUrl = () => {
  const base = getSellerPanelBaseUrl();
  return base.endsWith('/sign-in') ? base : `${base}/sign-in`;
};

/**
 * Create a Stripe Checkout Session for a plan and persist a pending payment row.
 */
const createCheckoutSession = async ({ planId, email, name, userId }: any) => {
  const plan = await PlanModel.findById(planId);
  if (!plan || plan.status !== 1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found or inactive.');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const displayName = (name || '').trim();
  const amountCents = Math.round(Number(plan.price) * 100);
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Plan price must be at least $0.50 for Stripe Checkout.'
    );
  }

  const existingUser = userId
    ? await User.findById(userId)
    : await User.findOne({ email: normalizedEmail, status: { $ne: 2 } });

  const payment = await PaymentModel.create({
    email: normalizedEmail,
    name: displayName,
    planId: plan._id,
    planName: plan.name,
    amount: Number(plan.price),
    currency: 'usd',
    mode: 'subscription',
    billingCycle: Number(plan.billingCycle) || 1,
    status: 'pending',
    userId: existingUser ? existingUser._id : null,
  });

  const frontend = (config.stripe.frontendUrl || '').replace(
    /\/$/,
    ''
  );
  const successUrl =
    config.stripe.successUrl ||
    `${frontend}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    config.stripe.cancelUrl || `${frontend}/payment/cancel?plan=${plan._id}`;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: normalizedEmail,
    client_reference_id: String(payment._id),
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata: {
      paymentId: String(payment._id),
      planId: String(plan._id),
      planName: plan.name,
      email: normalizedEmail,
    },
    subscription_data: {
      metadata: {
        paymentId: String(payment._id),
        planId: String(plan._id),
        email: normalizedEmail,
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          recurring:
            Number(plan.billingCycle) === 3
              ? { interval: 'year', interval_count: 1 }
              : Number(plan.billingCycle) === 2
                ? { interval: 'month', interval_count: 3 }
                : { interval: 'month', interval_count: 1 },
          product_data: {
            name: `Gravurtastisch - ${plan.name}`,
            description: `${plan.request_quota || 0} units/${Number(plan.billingCycle) === 3
              ? 'yr'
              : Number(plan.billingCycle) === 2
                ? 'quarter'
                : 'mo'
              } · ${plan.marketplace || 0} channels`,
            metadata: {
              planId: String(plan._id),
              billingCycle: String(plan.billingCycle || 1),
            },
          },
        },
      },
    ],
  });

  payment.stripeSessionId = session.id;
  payment.metadata = {
    ...(payment.metadata || {}),
    checkoutUrl: session.url,
  };
  await payment.save();

  if (existingUser && Array.isArray(existingUser.plans)) {
    const pendingPlan = existingUser.plans.find(
      (p: any) =>
        String(p.planId) === String(plan._id) &&
        (p.status === 0 || p.status === 'pending_payment')
    );
    if (pendingPlan) {
      pendingPlan.stripeSessionId = session.id;
      await existingUser.save();
    }
  }

  return {
    status: httpStatus.OK,
    message: 'Checkout session created.',
    data: {
      sessionId: session.id,
      url: session.url,
      paymentId: payment._id,
    },
  };
};

const getSessionStatus = async (sessionId) => {
  if (!sessionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'sessionId is required.');
  }

  const payment = await PaymentModel.findOne({ stripeSessionId: sessionId }).lean();
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found for this session.');
  }

  const planObj = payment.planId ? await PlanModel.findById(payment.planId).lean() : null;
  const envPanelUrl = getSellerPanelBaseUrl();
  const sellerPanelSignInUrl = getSellerPanelSignInUrl();

  // Auto-complete mock payments or poll Stripe for real payments
  if (payment.status === 'pending' && config.stripe.secretKey) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid' || session.status === 'complete') {
        await markPaymentPaid(payment._id, {
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          stripePaymentIntentId: session.payment_intent,
          eventId: `session-poll:${sessionId}`,
        });
        const refreshed = await PaymentModel.findById(payment._id).lean();

        return {
          status: httpStatus.OK,
          message: 'Payment status retrieved.',
          data: {
            ...refreshed,
            billingCycle: refreshed.billingCycle || (planObj && planObj.billingCycle) || 1,
            siteUrl: envPanelUrl,
            sellerPanelUrl: sellerPanelSignInUrl,
          },
        };
      }
    } catch (err) {
      logger.warn(`Stripe session poll failed: ${err.message}`);
    }
  }

  return {
    status: httpStatus.OK,
    message: 'Payment status retrieved.',
    data: {
      ...payment,
      billingCycle: payment.billingCycle || (planObj && planObj.billingCycle) || 1,
      siteUrl: envPanelUrl,
      sellerPanelUrl: sellerPanelSignInUrl,
    },
  };
};

const markPaymentPaid = async (paymentId: any, extras: any = {}) => {
  const payment = await PaymentModel.findById(paymentId);
  if (!payment) return null;

  if (extras.eventId && payment.processedEventIds.includes(extras.eventId)) {
    return payment;
  }

  const wasPaid = payment.status === 'paid';

  payment.status = 'paid';
  payment.paidAt = payment.paidAt || new Date();
  if (extras.stripeCustomerId) payment.stripeCustomerId = extras.stripeCustomerId;
  if (extras.stripeSubscriptionId) payment.stripeSubscriptionId = extras.stripeSubscriptionId;
  if (extras.stripePaymentIntentId) {
    payment.stripePaymentIntentId = extras.stripePaymentIntentId;
  }
  if (extras.stripeInvoiceId) payment.stripeInvoiceId = extras.stripeInvoiceId;
  if (extras.eventId) {
    payment.processedEventIds = [...(payment.processedEventIds || []), extras.eventId];
  }
  await payment.save();

  // Apply plan limits to matching user account if one exists
  const plan = await PlanModel.findById(payment.planId);
  const user =
    (payment.userId && (await User.findById(payment.userId))) ||
    (await User.findOne({ email: payment.email, status: { $ne: 2 } }));

  if (user && plan) {
    if (extras.stripeCustomerId) user.stripeCustomerId = extras.stripeCustomerId;
    if (extras.stripeSubscriptionId) {
      user.stripeSubscriptionId = extras.stripeSubscriptionId;
    }

    if (!Array.isArray(user.plans)) {
      user.plans = [];
    }

    const now = new Date();
    const cycle = Number(plan.billingCycle) || 1;

    // Check expiration on any plan with expireAt in the past
    user.plans.forEach((p: any) => {
      if (
        (p.status === 1 || p.status === 'active') &&
        p.expireAt &&
        new Date(p.expireAt).getTime() < now.getTime()
      ) {
        p.status = 2; // Expired
      }
    });

    // Check if user currently has an ongoing active (1) or queued (4) plan
    let latestExpireDate: Date | null = null;
    let currentActivePlan: any = null;

    user.plans.forEach((p: any) => {
      const isOngoing =
        (p.status === 1 || p.status === 4 || p.status === 'active' || p.status === 'queued') &&
        p.expireAt &&
        new Date(p.expireAt).getTime() > now.getTime();

      if (isOngoing) {
        const pExp = new Date(p.expireAt);
        if (!latestExpireDate || pExp.getTime() > latestExpireDate.getTime()) {
          latestExpireDate = pExp;
        }
        if (p.status === 1 || p.status === 'active') {
          currentActivePlan = p;
        }
      }
    });

    const hasOngoingPlan = Boolean(latestExpireDate && latestExpireDate.getTime() > now.getTime());
    const baseStartDate = hasOngoingPlan ? new Date(latestExpireDate!) : new Date(now);

    let expireDate = plan.expireAt;
    if (!expireDate) {
      const calcExpire = new Date(baseStartDate);
      if (cycle === 2) {
        calcExpire.setMonth(calcExpire.getMonth() + 3);
      } else if (cycle === 3) {
        calcExpire.setFullYear(calcExpire.getFullYear() + 1);
      } else {
        calcExpire.setMonth(calcExpire.getMonth() + 1);
      }
      expireDate = calcExpire;
    }

    const planStatus = hasOngoingPlan ? 4 : 1; // 4: queued if seller already has active plan, 1: active immediately

    if (!hasOngoingPlan) {
      // Immediately activate new plan
      user.currentPlanId = plan._id;
      user.planLimits = {
        maxMarketplaces: Number(plan.marketplace) || user.planLimits?.maxMarketplaces || 5,
        maxReviewRequestsPerMonth:
          Number(plan.request_quota) || user.planLimits?.maxReviewRequestsPerMonth || 1000,
      };
    }
    // If hasOngoingPlan: current active plan remains active with its limits, new plan queues!

    user.subscriptionStatus = 1; // 1: active
    user.status = 1; // Activate user account so seller can access dashboard

    const existingPlanIndex = user.plans.findIndex(
      (p: any) =>
        (p.planId &&
          String(p.planId) === String(plan._id) &&
          (p.paymentStatus === 0 || p.paymentStatus === 'pending' || p.paymentStatus !== 1)) ||
        (payment.stripeSessionId && p.stripeSessionId === payment.stripeSessionId)
    );

    if (existingPlanIndex !== -1) {
      user.plans[existingPlanIndex].status = planStatus;
      user.plans[existingPlanIndex].paymentStatus = 1; // paid
      user.plans[existingPlanIndex].price = Number(plan.price) || 0;
      user.plans[existingPlanIndex].marketplace = Number(plan.marketplace) || 1;
      user.plans[existingPlanIndex].request_quota = Number(plan.request_quota) || 1000;
      user.plans[existingPlanIndex].billingCycle = cycle;
      user.plans[existingPlanIndex].name = plan.name;
      user.plans[existingPlanIndex].startsAt = baseStartDate;
      user.plans[existingPlanIndex].expireAt = expireDate;
      user.plans[existingPlanIndex].stripeSessionId =
        payment.stripeSessionId || user.plans[existingPlanIndex].stripeSessionId;
      user.plans[existingPlanIndex].stripePaymentIntentId =
        extras.stripePaymentIntentId || payment.stripePaymentIntentId || null;
      user.plans[existingPlanIndex].selectedAt = now;
    } else {
      user.plans.push({
        planId: plan._id,
        name: plan.name,
        price: Number(plan.price) || 0,
        marketplace: Number(plan.marketplace) || 1,
        request_quota: Number(plan.request_quota) || 1000,
        billingCycle: cycle,
        startsAt: baseStartDate,
        expireAt: expireDate,
        status: planStatus,
        paymentStatus: 1, // paid
        stripeSessionId: payment.stripeSessionId || null,
        stripePaymentIntentId:
          extras.stripePaymentIntentId || payment.stripePaymentIntentId || null,
        selectedAt: now,
      });
    }

    await user.save();
    payment.userId = user._id;
    await payment.save();
  }

  if (!wasPaid) {
    await notifyPaymentPaid(payment, plan).catch((err) =>
      logger.warn(`Payment notification failed: ${err.message}`)
    );
  }

  return payment;
};

const notifyPaymentPaid = async (payment: any, plan: any) => {
  const planName = payment.planName || plan?.name || 'Subscription Plan';
  const cycle = Number(payment.billingCycle || plan?.billingCycle) || 1;
  const cycleName = cycle === 3 ? 'Annual' : cycle === 2 ? 'Quarterly' : 'Monthly';
  const cycleSuffix = cycle === 3 ? '/yr' : cycle === 2 ? '/qtr' : '/mo';
  const amountFormatted = Number(payment.amount || plan?.price || 0).toFixed(2);
  const currencyUpper = String(payment.currency || 'usd').toUpperCase();
  const quotaText = plan?.request_quota
    ? `${Number(plan.request_quota).toLocaleString()} custom units / month`
    : 'Unlimited custom units / month';
  const marketplaceText = plan?.marketplace
    ? `${plan.marketplace} ${Number(plan.marketplace) === 1 ? 'sales channel' : 'sales channels'}`
    : 'Multi-channel access';

  const sellerPanelSignInUrl = getSellerPanelSignInUrl();

  // 1. Send confirmation email to the seller / customer
  if (payment.email) {
    try {
      const customerSubject = `Payment Confirmed — Welcome to Gravurtastisch (${planName})`;
      const customerContent = `
        <div style="text-align:center; padding:0 0 16px;">
          <div style="display:inline-block; width:44px; height:44px; line-height:44px; border-radius:50%; background-color:#ECFDF5; border:2px solid #10B981; text-align:center; margin-bottom:8px;">
            <span style="font-size:22px; color:#10B981; line-height:44px; font-weight:bold;">&#10003;</span>
          </div>
          <h1 style="margin:0 0 6px; font-size:21px; font-weight:800; color:#1E1E1E; font-family:'Montserrat','Inter',Arial,sans-serif;">Payment Successful!</h1>
          <p style="margin:0 auto; max-width:540px; font-size:13.5px; line-height:1.5; color:#4A4A48; font-family:'Inter',Arial,sans-serif;">
            Hi <strong>${payment.name || payment.email}</strong>, thank you for subscribing to <strong>Gravurtastisch</strong>. Your payment has been received and your seller account is now fully active.
          </p>
        </div>

        <!-- 2-Column Left & Right Split: Details + Action -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:14px; border-collapse:collapse;">
          <tr>
            <!-- LEFT PART: Plan Details -->
            <td class="stack-col" width="53%" style="vertical-align:top; padding-right:8px; padding-bottom:10px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FAF9F6; border:1px solid #E5E0D5; border-radius:10px; border-collapse:separate; height:100%;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-family:'Montserrat','Inter',Arial,sans-serif; font-size:12px; font-weight:800; color:#1E1E1E; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; border-bottom:1px solid #EBDCC8; padding-bottom:5px;">
                      Subscription Details
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:4px 0; color:#78716C; font-size:12px; font-weight:600; font-family:'Inter',Arial,sans-serif;">Subscribed Plan</td>
                        <td style="padding:4px 0; color:#1E1E1E; font-size:12.5px; font-weight:700; text-align:right; font-family:'Inter',Arial,sans-serif;">${planName}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0; color:#78716C; font-size:12px; font-weight:600; font-family:'Inter',Arial,sans-serif;">Billing Frequency</td>
                        <td style="padding:4px 0; text-align:right;">
                          <span style="display:inline-block; background-color:#FAF5EE; color:#9A6F33; border:1px solid #EBDCC8; font-size:11px; font-weight:700; padding:1px 8px; border-radius:9999px;">${cycleName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0; color:#78716C; font-size:12px; font-weight:600; font-family:'Inter',Arial,sans-serif;">Amount Paid</td>
                        <td style="padding:4px 0; color:#282828; font-size:13.5px; font-weight:800; text-align:right; font-family:'Inter',Arial,sans-serif;">$${amountFormatted} ${currencyUpper} <span style="font-size:11px; color:#78716C; font-weight:normal;">(${cycleSuffix})</span></td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0; color:#78716C; font-size:12px; font-weight:600; font-family:'Inter',Arial,sans-serif;">Monthly Quota</td>
                        <td style="padding:4px 0; color:#1E1E1E; font-size:11.5px; text-align:right; font-family:'Inter',Arial,sans-serif;">${quotaText}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0; color:#78716C; font-size:12px; font-weight:600; font-family:'Inter',Arial,sans-serif;">Channels</td>
                        <td style="padding:4px 0; color:#1E1E1E; font-size:11.5px; text-align:right; font-family:'Inter',Arial,sans-serif;">${marketplaceText}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0; color:#78716C; font-size:12px; font-weight:600; font-family:'Inter',Arial,sans-serif;">Registered Email</td>
                        <td style="padding:4px 0; color:#1E1E1E; font-size:11.5px; text-align:right; font-family:'Inter',Arial,sans-serif; word-break:break-all;">${payment.email}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0; color:#78716C; font-size:12px; font-weight:600; font-family:'Inter',Arial,sans-serif;">Status</td>
                        <td style="padding:4px 0; text-align:right;">
                          <span style="display:inline-block; background-color:#D1FAE5; color:#065F46; font-size:11px; font-weight:700; padding:1px 8px; border-radius:9999px;">Active</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>

            <!-- RIGHT PART: Direct Access & Action -->
            <td class="stack-col" width="47%" style="vertical-align:top; padding-left:8px; padding-bottom:10px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FAF9F6; border:1px solid #E5E0D5; border-radius:10px; border-collapse:separate; height:100%;">
                <tr>
                  <td style="padding:14px 16px; text-align:center;">
                    <div style="font-family:'Montserrat','Inter',Arial,sans-serif; font-size:12px; font-weight:800; color:#1E1E1E; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; border-bottom:1px solid #EBDCC8; padding-bottom:5px; text-align:left;">
                      Seller Panel Access
                    </div>

                    <!-- Direct CTA Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto 10px;">
                      <tr>
                        <td style="border-radius:50px; background-color:#B8966C; text-align:center; box-shadow:0 3px 10px rgba(184,150,108,0.3);">
                          <a href="${sellerPanelSignInUrl}"
                             style="display:inline-block; padding:11px 24px; font-family:'Inter',Arial,sans-serif;
                                    font-size:13.5px; font-weight:800; color:#1E1E1E; text-decoration:none; border-radius:50px; letter-spacing:0.3px; white-space:nowrap;">
                            Go to Seller Panel &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 10px; font-size:11px; color:#78716C; font-family:'Inter',Arial,sans-serif; line-height:1.4;">
                      Access anytime at:<br/>
                      <a href="${sellerPanelSignInUrl}" style="color:#282828; font-weight:600; text-decoration:underline; word-break:break-all;">${sellerPanelSignInUrl}</a>
                    </p>

                    <!-- Guidance Note -->
                    <div style="background-color:#ffffff; border-left:3px solid #B8966C; border-radius:0 6px 6px 0; padding:8px 10px; text-align:left; border-top:1px solid #EAE7E0; border-right:1px solid #EAE7E0; border-bottom:1px solid #EAE7E0;">
                      <p style="margin:0; font-size:11px; line-height:1.45; color:#57534E; font-family:'Inter',Arial,sans-serif;">
                        <strong>Sign-in:</strong> Use <strong>${payment.email}</strong> to sign in and connect your store.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:4px 0 0; font-size:11.5px; line-height:1.4; color:#78716C; text-align:center; font-family:'Inter',Arial,sans-serif;">
          Questions? Reply to this email or contact support at <a href="mailto:info@ctasis.com" style="color:#282828; font-weight:600;">info@ctasis.com</a>.
        </p>
      `;

      const customerHtml = await emailService.getMailBody(
        customerContent,
        `Payment confirmed for your Gravurtastisch ${planName} plan.`
      );

      await emailService.sendEmail(payment.email, customerSubject, '', customerHtml);
      logger.info(`Payment confirmation email sent to seller: ${payment.email}`);
    } catch (err: any) {
      logger.error(`Failed to send customer payment confirmation email to ${payment.email}: ${err.message}`);
    }
  }

  // 2. Send notification email to admin
  const adminTo = config.email.adminEmail || config.email.from;
  if (adminTo) {
    try {
      const adminSubject = `Payment received — ${planName} ($${amountFormatted}${cycleSuffix}) [${payment.email}]`;
      const adminHtml = `
        <h2>Stripe payment confirmed</h2>
        <p><strong>Email:</strong> ${payment.email}</p>
        <p><strong>Name:</strong> ${payment.name || '—'}</p>
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Billing Cycle:</strong> ${cycleName} (${cycle})</p>
        <p><strong>Amount:</strong> $${amountFormatted} ${currencyUpper}${cycleSuffix}</p>
        <p><strong>Session ID:</strong> ${payment.stripeSessionId || '—'}</p>
        <p><strong>Subscription ID:</strong> ${payment.stripeSubscriptionId || '—'}</p>
        <p><strong>Seller Panel URL:</strong> <a href="${sellerPanelSignInUrl}">${sellerPanelSignInUrl}</a></p>
        <p>Recorded via Stripe checkout / webhook acknowledgement.</p>
      `;
      await emailService.sendEmail(adminTo, adminSubject, adminSubject, adminHtml);
      logger.info(`Payment notification email sent to admin: ${adminTo}`);
    } catch (err: any) {
      logger.warn(`Admin payment notification email failed: ${err.message}`);
    }
  }
};

/**
 * Verify Stripe signature and process payment lifecycle events.
 */
const handleWebhook = async (rawBody, signature) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Stripe webhook secret is not configured (STRIPE_WEBHOOK_SECRET).'
    );
  }
  if (!signature) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Stripe-Signature header.');
  }

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    logger.error(`Stripe webhook signature failed: ${err.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, `Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId || session.client_reference_id;
      let payment = paymentId ? await PaymentModel.findById(paymentId) : null;
      if (!payment && session.id) {
        payment = await PaymentModel.findOne({ stripeSessionId: session.id });
      }
      if (payment) {
        await markPaymentPaid(payment._id, {
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          stripePaymentIntentId: session.payment_intent,
          eventId: event.id,
        });
      } else {
        logger.warn(`checkout.session.completed with no matching payment: ${session.id}`);
      }
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        const payment = await PaymentModel.findOne({ stripeSubscriptionId: subId }).sort({
          createdAt: -1,
        });
        if (payment) {
          await markPaymentPaid(payment._id, {
            stripeCustomerId: invoice.customer,
            stripeSubscriptionId: subId,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent,
            eventId: event.id,
          });
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const payment = await PaymentModel.findOne({ stripeSubscriptionId: sub.id });
      if (payment && !payment.processedEventIds.includes(event.id)) {
        payment.status = 'canceled';
        payment.processedEventIds = [...(payment.processedEventIds || []), event.id];
        await payment.save();
        if (payment.userId) {
          await User.findByIdAndUpdate(payment.userId, {
            subscriptionStatus: 3, // 3: canceled
          });
        }
      }
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object;
      const payment = await PaymentModel.findOne({ stripeSessionId: session.id });
      if (payment && payment.status === 'pending' && !payment.processedEventIds.includes(event.id)) {
        payment.status = 'canceled';
        payment.processedEventIds = [...(payment.processedEventIds || []), event.id];
        await payment.save();
      }
      break;
    }
    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
  }

  return { received: true, type: event.type };
};

module.exports = {
  createCheckoutSession,
  getSessionStatus,
  handleWebhook,
  markPaymentPaid,
};
