// @ts-nocheck
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
let db = mongoose.connection;
const RoleModel = require('../models/role.model');

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
      <h1 style="margin:0 0 5px; font-family:'Montserrat', Arial, sans-serif; font-size:21px; font-weight:800; color:#1E1E1E; text-align:center;">Your login code</h1>
      <p style="margin:0 0 15px; font-family:'Inter', Arial, sans-serif; font-size:13px; line-height:1.45; color:#78716C; text-align:center;">Enter this one-time code to sign in to your Gravurtastisch account.</p>

      <!-- Code Box (No copy button, pure clean code display) -->
      <div style="background-color:#FAF9F6; border:1.5px dashed #D2B48C; border-radius:10px; padding:12px 22px; text-align:center; margin:0 auto 15px; max-width:275px;">
        <span style="font-family:'Courier New', Courier, monospace; font-size:30px; font-weight:800; letter-spacing:7px; color:#1E1E1E; white-space:nowrap; display:inline-block; user-select:all; -webkit-user-select:all;">
          ${otp}
        </span>
      </div>

      <!-- Point-wise Details -->
      <div style="background-color:#FAF9F6; border:1px solid #E5E0D5; border-radius:9px; padding:11px 15px; margin:0 0 15px; text-align:left;">
        <p style="margin:0 0 6px; font-family:'Inter', Arial, sans-serif; font-size:11px; font-weight:700; color:#282828; text-transform:uppercase; letter-spacing:0.4px;">
          Security &amp; Instructions:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="vertical-align:top; width:13px; font-size:13px; color:#D2B48C; line-height:1.5;">&#x2022;</td>
            <td style="font-family:'Inter', Arial, sans-serif; font-size:12px; line-height:1.5; color:#4A4A48; padding-bottom:4px;">
              <strong>Validity:</strong> This code expires in <strong>${config.otp.expiryMinutes || 10} minutes</strong>.
            </td>
          </tr>
          <tr>
            <td style="vertical-align:top; width:13px; font-size:13px; color:#D2B48C; line-height:1.5;">&#x2022;</td>
            <td style="font-family:'Inter', Arial, sans-serif; font-size:12px; line-height:1.5; color:#4A4A48; padding-bottom:4px;">
              <strong>Confidential:</strong> Never share this code with anyone. Our team will never ask for it.
            </td>
          </tr>
          <tr>
            <td style="vertical-align:top; width:13px; font-size:13px; color:#D2B48C; line-height:1.5;">&#x2022;</td>
            <td style="font-family:'Inter', Arial, sans-serif; font-size:12px; line-height:1.5; color:#4A4A48;">
              <strong>Didn't request?</strong> If you did not request this login code, please ignore this email.
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0; font-family:'Inter', Arial, sans-serif; font-size:12.5px; line-height:1.45; color:#78716C; text-align:center;">
        Thank you,<br/>
        <strong style="color:#282828;">The Gravurtastisch Team</strong>
      </p>
    </div>
  `;
  const html = await getMailBody(
    content,
    `Your Gravurtastisch verification code is ${otp}`
  );
  await sendEmail(to, subject, '', html);
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
  sendEmailToTeam,
  getMailTemplateByKey,
  replaceContents,
  getMailBody,
  getGroupEmailId,
  getGroupEmailIdsForCC,
};
