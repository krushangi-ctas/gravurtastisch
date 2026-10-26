// @ts-nocheck
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const RoleModel = require('../models/role.model');
const moment = require('moment');

const smtpHost = config.email.smtp?.host || 'smtp.gmail.com';
const smtpUser = config.email.smtp?.auth?.user || '';
const smtpPass = config.email.smtp?.auth?.pass || '';
const smtpPort = Number(config.email.smtp?.port) || 465;



console.log('--- [SMTP CONFIG CHECK] ---');
console.log('SMTP Host:', smtpHost);
console.log('SMTP Port:', smtpPort);
console.log('SMTP Username:', smtpUser ? smtpUser : '(EMPTY / NOT SET)');
console.log('SMTP Password set:', smtpPass ? `YES (${smtpPass.length} chars)` : 'NO (EMPTY / NOT SET)');
console.log('---------------------------');

const isSecure = Number(smtpPort) === 465;

const transport = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: isSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

async function verifySMTP() {
  try {
    console.log('[SMTP] Testing connection to', smtpHost, 'on port', smtpPort, '...');
    await transport.verify();
    console.log('[SMTP SUCCESS] Connected to email server successfully!');
    logger.info('Connected to email server');
  } catch (error: any) {
    console.error('[SMTP VERIFY FAILED] Error details:', {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      syscall: error?.syscall,
      address: error?.address,
      port: error?.port,
    });
    logger.warn(
      `Unable to connect to email server: ${error?.message || error}. Make sure SMTP options are set in .env`
    );
  }
}

/* istanbul ignore next */
if (config.env !== 'test') {
  verifySMTP();
}

const getLogoAttachment = () => {
  const logoCandidatePaths = [
    path.join(__dirname, '../../public/white-gravurtastisch.png'),
    path.join(__dirname, '../public/white-gravurtastisch.png'),
    path.join(__dirname, 'public/white-gravurtastisch.png'),
    path.join(process.cwd(), 'public/white-gravurtastisch.png'),
    path.join(process.cwd(), 'gravurtastisch_core/public/white-gravurtastisch.png'),
    path.join(process.cwd(), '../public/white-gravurtastisch.png'),
  ];
  const logoPath = logoCandidatePaths.find((p) => fs.existsSync(p));
  if (!logoPath) return null;
  return {
    filename: 'white-gravurtastisch.png',
    path: logoPath,
    cid: 'white_gravurtastisch_logo',
    contentType: 'image/png',
    contentDisposition: 'inline',
  };
};

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @param {Array} attachments
 * @returns {Promise}
 */
const sendEmail = async (
  to: string,
  subject: string,
  text?: string,
  html?: string,
  attachments: any[] = []
) => {
  console.log(`[SMTP] Attempting to send email to "${to}" | Subject: "${subject}"`);
  if (!config.email.smtp?.host || !config.email.smtp?.auth?.user) {
    console.warn(
      `[SMTP WARN] SMTP credentials missing. Host: "${config.email.smtp?.host}", User: "${config.email.smtp?.auth?.user}"`
    );
    logger.warn(`SMTP credentials not configured. Skipping email to ${to}: "${subject}"`);
    return;
  }

  const finalAttachments = Array.isArray(attachments) ? [...attachments] : [];
  if (html && html.includes('cid:white_gravurtastisch_logo')) {
    const logoAttachment = getLogoAttachment();
    if (logoAttachment) {
      finalAttachments.push(logoAttachment);
    }
  }

  const msg: any = { from: config.email.from, to, subject, text, html };
  if (finalAttachments.length > 0) {
    msg.attachments = finalAttachments;
  }
  try {
    const info = await transport.sendMail(msg);
    console.log(`[SMTP SUCCESS] Email delivered to ${to}. MessageId:`, info?.messageId);
    return info;
  } catch (error: any) {
    console.error(`[SMTP SEND ERROR] Failed sending to ${to}:`, {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
    });
    throw error;
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
// const sendResetPasswordEmail = async (to, token) => {
//   const subject = "Reset password";
//   // replace this url with the link to the reset password page of your front-end app
//   const resetPasswordUrl = `${config.site_url}/reset-password?token=${token}`;
//   const text = `Dear user,
// To reset your password, click on this link: ${resetPasswordUrl}
// If you did not request any password resets, then ignore this email.`;
//   await sendEmail(to, subject, text);
// };

const sendResetPasswordEmail = async (to, token, user) => {
  const subject = 'Reset password';
  const resetPasswordUrl = `${config.site_url}/reset-password?token=${token}`;
  const content = `
    <h1>Reset your password</h1>
    <p>Dear ${user.first_name || ''} ${user.last_name || ''},</p>
    <p>You have requested to reset your password. Click the button below to set a new password. This link expires in 10 minutes.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
      <tr>
        <td style="border-radius:8px; background-color:#282828;">
          <a href="${resetPasswordUrl}"
             style="display:inline-block; padding:13px 28px; font-family:'Inter',Arial,sans-serif;
                    font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:8px;">
            Reset Password &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p style="color:#525252;">Thank you,<br/>The Gravurtastisch Team</p>
  `;
  const html = await getMailBody(content, 'Reset your Gravurtastisch password');
  await sendEmail(to, subject, '', html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

const sendOtpEmail = async (to, otp) => {
  const subject = 'Your Gravurtastisch Login Code';
  const content = `
    <div style="text-align:center;">
      <h1 style="margin:0 0 6px; font-family:'Montserrat', Arial, sans-serif; font-size:22px; font-weight:800; color:#0B132B; text-align:center;">Your login code</h1>
      <p style="margin:0 0 16px; font-family:'Inter', Arial, sans-serif; font-size:13.5px; line-height:1.45; color:#64748B; text-align:center;">Enter this one-time code to sign in to your Gravurtastisch account.</p>

      <!-- Code Box (Royal Blue Branding) -->
      <div style="background-color:#F0F5FF; border:2px dashed #0032AB; border-radius:12px; padding:14px 22px; text-align:center; margin:0 auto 16px; max-width:280px; box-shadow:0 2px 10px rgba(0,50,171,0.06);">
        <span style="font-family:'Courier New', Courier, monospace; font-size:32px; font-weight:800; letter-spacing:8px; color:#0032AB; white-space:nowrap; display:inline-block; user-select:all; -webkit-user-select:all;">
          ${otp}
        </span>
      </div>

      <!-- Point-wise Details -->
      <div style="background-color:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; margin:0 0 16px; text-align:left;">
        <p style="margin:0 0 8px; font-family:'Inter', Arial, sans-serif; font-size:11px; font-weight:700; color:#0B132B; text-transform:uppercase; letter-spacing:0.5px;">
          Security &amp; Instructions:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="vertical-align:top; width:14px; font-size:15px; color:#0032AB; line-height:1.4; font-weight:bold;">&#x2022;</td>
            <td style="font-family:'Inter', Arial, sans-serif; font-size:12.5px; line-height:1.5; color:#334155; padding-bottom:5px;">
              <strong>Validity:</strong> This code expires in <strong>${config.otp.expiryMinutes || 10} minutes</strong>.
            </td>
          </tr>
          <tr>
            <td style="vertical-align:top; width:14px; font-size:15px; color:#0032AB; line-height:1.4; font-weight:bold;">&#x2022;</td>
            <td style="font-family:'Inter', Arial, sans-serif; font-size:12.5px; line-height:1.5; color:#334155; padding-bottom:5px;">
              <strong>Confidential:</strong> Never share this code with anyone. Our team will never ask for it.
            </td>
          </tr>
          <tr>
            <td style="vertical-align:top; width:14px; font-size:15px; color:#0032AB; line-height:1.4; font-weight:bold;">&#x2022;</td>
            <td style="font-family:'Inter', Arial, sans-serif; font-size:12.5px; line-height:1.5; color:#334155;">
              <strong>Didn't request?</strong> If you did not request this login code, please ignore this email.
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0; font-family:'Inter', Arial, sans-serif; font-size:12.5px; line-height:1.45; color:#64748B; text-align:center;">
        Thank you,<br/>
        <strong style="color:#0032AB;">The Gravurtastisch Team</strong>
      </p>
    </div>
  `;
  const html = await getMailBody(
    content,
    `Your Gravurtastisch verification code is ${otp}`
  );
  await sendEmail(to, subject, '', html);
};

/**
 * Send subscription plan expiring tomorrow reminder email
 * @param {Object} user User object with email, first_name, last_name
 * @param {Object} plan Active plan subdocument
 */
const sendPlanExpiryReminderEmail = async (user, plan) => {
  const sellerName =
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.email?.split('@')[0] ||
    'Valued Seller';
  const planName = plan.name || 'Subscription Plan';
  const expireDateFormatted = plan.expireAt
    ? moment(plan.expireAt).format('MMMM DD, YYYY')
    : moment().add(1, 'day').format('MMMM DD, YYYY');

  const billingCycleLabels = {
    1: 'Monthly',
    2: 'Quarterly',
    3: 'Yearly',
  };
  const billingCycleText = billingCycleLabels[plan.billingCycle] || 'Monthly';
  const requestQuotaText = plan.request_quota
    ? `${plan.request_quota.toLocaleString()} requests / month`
    : 'Standard';
  const marketplaceText = plan.marketplace
    ? `${plan.marketplace} marketplace(s)`
    : '1 marketplace';

  const subject = `Urgent: Your Gravurtastisch Plan Expires Tomorrow (${expireDateFormatted})`;
  const preheader = `Your ${planName} plan expires tomorrow. Renew today to avoid interruption in Amazon reviews and solicitations.`;

  const content = `
    <!-- Expiry Notice Badge -->
    <div style="margin-bottom:16px;">
      <span style="display:inline-block; font-family:'Inter', Arial, sans-serif; font-size:11px; font-weight:700; color:#B45309; background-color:#FEF3C7; border:1px solid #FCD34D; padding:4px 12px; border-radius:999px; letter-spacing:0.4px; text-transform:uppercase;">
        &#9888; Action Required &middot; Plan Expiring Tomorrow
      </span>
    </div>

    <!-- Heading -->
    <h1 style="margin:0 0 10px; font-family:'Montserrat', Arial, sans-serif; font-size:23px; font-weight:800; color:#0B132B; line-height:1.3;">
      Your Subscription Expires Tomorrow
    </h1>

    <p style="margin:0 0 16px; font-family:'Inter', Arial, sans-serif; font-size:14.5px; line-height:1.6; color:#334155;">
      Hello <strong>${sellerName}</strong>,
    </p>

    <p style="margin:0 0 18px; font-family:'Inter', Arial, sans-serif; font-size:14px; line-height:1.6; color:#334155;">
      This is a friendly reminder that your <strong>${planName}</strong> subscription plan on <strong>Gravurtastisch</strong> is scheduled to expire tomorrow, on <strong style="color:#0B132B;">${expireDateFormatted}</strong>.
    </p>

    <!-- Plan Summary Box -->
    <div style="background-color:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:18px 20px; margin:0 0 22px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
      <p style="margin:0 0 12px; font-family:'Montserrat', Arial, sans-serif; font-size:12px; font-weight:700; color:#0032AB; text-transform:uppercase; letter-spacing:0.6px;">
        Subscription Details
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:7px 0; border-bottom:1px solid #F1F5F9; font-family:'Inter', Arial, sans-serif; font-size:13px; color:#64748B; width:45%;">
            Plan Name:
          </td>
          <td style="padding:7px 0; border-bottom:1px solid #F1F5F9; font-family:'Inter', Arial, sans-serif; font-size:13.5px; font-weight:700; color:#0B132B;">
            ${planName}
          </td>
        </tr>
        <tr>
          <td style="padding:7px 0; border-bottom:1px solid #F1F5F9; font-family:'Inter', Arial, sans-serif; font-size:13px; color:#64748B;">
            Expiration Date:
          </td>
          <td style="padding:7px 0; border-bottom:1px solid #F1F5F9; font-family:'Inter', Arial, sans-serif; font-size:13.5px; font-weight:700; color:#DC2626;">
            ${expireDateFormatted} (Tomorrow)
          </td>
        </tr>
        <tr>
          <td style="padding:7px 0; border-bottom:1px solid #F1F5F9; font-family:'Inter', Arial, sans-serif; font-size:13px; color:#64748B;">
            Billing Cycle:
          </td>
          <td style="padding:7px 0; border-bottom:1px solid #F1F5F9; font-family:'Inter', Arial, sans-serif; font-size:13.5px; font-weight:600; color:#334155;">
            ${billingCycleText}
          </td>
        </tr>
        <tr>
          <td style="padding:7px 0; border-bottom:1px solid #F1F5F9; font-family:'Inter', Arial, sans-serif; font-size:13px; color:#64748B;">
            Review Quota:
          </td>
          <td style="padding:7px 0; border-bottom:1px solid #F1F5F9; font-family:'Inter', Arial, sans-serif; font-size:13.5px; font-weight:600; color:#334155;">
            ${requestQuotaText}
          </td>
        </tr>
        <tr>
          <td style="padding:7px 0; font-family:'Inter', Arial, sans-serif; font-size:13px; color:#64748B;">
            Connected Marketplaces:
          </td>
          <td style="padding:7px 0; font-family:'Inter', Arial, sans-serif; font-size:13.5px; font-weight:600; color:#334155;">
            ${marketplaceText}
          </td>
        </tr>
      </table>
    </div>

    <!-- Callout Box -->
    <div style="background-color:#EFF6FF; border-left:4px solid #0032AB; border-radius:0 8px 8px 0; padding:12px 16px; margin:0 0 22px;">
      <p style="margin:0; font-family:'Inter', Arial, sans-serif; font-size:13px; line-height:1.55; color:#1E3A8A;">
        <strong>Important:</strong> When your plan expires, automated review requests and solicitations will pause for your Amazon store until your subscription is renewed.
      </p>
    </div>

    <!-- Point-wise instructions -->
    <div style="margin:0 0 20px;">
      <p style="margin:0 0 8px; font-family:'Inter', Arial, sans-serif; font-size:12px; font-weight:700; color:#0B132B; text-transform:uppercase; letter-spacing:0.5px;">
        Why renew before expiration?
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="vertical-align:top; width:16px; font-size:14px; color:#0032AB; line-height:1.4; font-weight:bold;">&#x2713;</td>
          <td style="font-family:'Inter', Arial, sans-serif; font-size:13px; line-height:1.5; color:#475569; padding-bottom:6px;">
            <strong>Zero downtime:</strong> Your automated Amazon feedback requests continue without disruption.
          </td>
        </tr>
        <tr>
          <td style="vertical-align:top; width:16px; font-size:14px; color:#0032AB; line-height:1.4; font-weight:bold;">&#x2713;</td>
          <td style="font-family:'Inter', Arial, sans-serif; font-size:13px; line-height:1.5; color:#475569; padding-bottom:6px;">
            <strong>Retain quota:</strong> Keep your monthly quota balance active across all integrated marketplaces.
          </td>
        </tr>
        <tr>
          <td style="vertical-align:top; width:16px; font-size:14px; color:#0032AB; line-height:1.4; font-weight:bold;">&#x2713;</td>
          <td style="font-family:'Inter', Arial, sans-serif; font-size:13px; line-height:1.5; color:#475569;">
            <strong>Seamless management:</strong> Easily choose your preferred billing cycle (Monthly, Quarterly, or Yearly).
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 16px; font-family:'Inter', Arial, sans-serif; font-size:13px; line-height:1.55; color:#64748B;">
      If you have already renewed or updated your plan, please disregard this email. If you need any assistance, feel free to reply directly to this email or reach us at <a href="mailto:info@ctasis.com" style="color:#0032AB; font-weight:600; text-decoration:none;">info@ctasis.com</a>.
    </p>

    <p style="margin:0; font-family:'Inter', Arial, sans-serif; font-size:13px; line-height:1.5; color:#64748B;">
      Warm regards,<br/>
      <strong style="color:#0032AB;">The Gravurtastisch Team</strong>
    </p>
  `;

  const html = await getMailBody(content, preheader);
  return sendEmail(user.email, subject, '', html);
};

async function getMailTemplateByKey(key) {
  return db
    .collection('tbl_email_templates')
    .findOne({ template_trigger: key, status: 1 });
}
const sendEmailToTeam = async (to, cc = [], subject, text, requestData) => {
  if (!cc || (Array.isArray(cc) && cc.length === 0)) {
    cc = [
      'krushangi.ctasis.llp@gmail.com',
      'arshilp@ctasis.com',
    ];
  }
  const finalAttachments = [];
  if (requestData && requestData.includes('cid:white_gravurtastisch_logo')) {
    const logoAttachment = getLogoAttachment();
    if (logoAttachment) {
      finalAttachments.push(logoAttachment);
    }
  }
  const msg: any = {
    from: config.email.from,
    to,
    cc,
    subject,
    text: text,
    html: requestData,
  };
  if (finalAttachments.length > 0) {
    msg.attachments = finalAttachments;
  }
  try {
    await transport.sendMail(msg);
    return true;
  } catch (error) {
    logger.error('Error sending email to team:', error);
    return false;
  }
};

const replaceContents = async (content, data) => {
  Object.keys(data).map((key, index) => {
    index == 0
      ? (content = content.replaceAll('{{' + key + '}}', data[key]))
      : (content = content.replaceAll('{{' + key + '}}', data[key]));
  });
  return { content, data };
};

const getMailBody = async (content, preheader = '') => {
  const candidatePaths = [
    path.join(__dirname, '../templates/email-template.html'),
    path.join(__dirname, '../../src/templates/email-template.html'),
    path.join(process.cwd(), 'src/templates/email-template.html'),
    path.join(process.cwd(), 'gravurtastisch_core/src/templates/email-template.html'),
    path.join(process.cwd(), 'dist/templates/email-template.html'),
  ];
  const templatePath = candidatePaths.find((p) => fs.existsSync(p));
  if (!templatePath) {
    logger.warn('Email template file not found, using raw content');
    return content;
  }
  let html = fs.readFileSync(templatePath, 'utf8');

  const baseUrl = (config.site_url || '').replace(/\/+$/, '');
  const logoUrl = 'cid:white_gravurtastisch_logo';

  html = html.replaceAll('{{CONTENT_PLACED_HERE}}', content);
  html = html.replaceAll('{{PREHEADER_TEXT}}', preheader);
  html = html.replaceAll('{{SITE_URL}}', baseUrl);
  html = html.replaceAll('{{LOGO_URL}}', logoUrl);
  html = html.replaceAll(
    '{{UNSUBSCRIBE_URL}}',
    `${baseUrl}/unsubscribe`
  );

  return html;
};

const getGroupEmailId = async (id) => {
  const role = await RoleModel.findById(id).select('group_email_id');
  return role?.group_email_id || null;
};

const getGroupEmailIdsForCC = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const roles = await RoleModel.find({ _id: { $in: ids } }).select(
    'group_email_id'
  );
  return roles.map((role) => role.group_email_id).filter((email) => !!email); // Remove null/undefined
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendOtpEmail,
  sendPlanExpiryReminderEmail,
  sendEmailToTeam,
  getMailTemplateByKey,
  replaceContents,
  getMailBody,
  getGroupEmailId,
  getGroupEmailIdsForCC,
};
