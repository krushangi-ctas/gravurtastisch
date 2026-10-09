// @ts-nocheck
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
let db = mongoose.connection;
const RoleModel = require('../models/role.model');

const transport = nodemailer.createTransport({
  ...config.email.smtp,
  tls: {
    rejectUnauthorized: false, // Disable SSL certificate verification
  },
});
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() =>
      logger.warn(
        'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
      )
    );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to: string, subject: string, text?: string, html?: string) => {
  const msg = { from: config.email.from, to, subject, text, html };
  await transport.sendMail(msg);
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
        <td style="border-radius:8px; background-color:#2F5FE3;">
          <a href="${resetPasswordUrl}"
             style="display:inline-block; padding:13px 28px; font-family:'Inter',Arial,sans-serif;
                    font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:8px;">
            Reset Password &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p style="color:#5B6B82;">Thank you,<br/>The ReviewSnapp Team</p>
  `;
  const html = await getMailBody(content, 'Reset your ReviewSnapp password');
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
  const subject = 'Your ReviewSnapp Login Code';
  const content = `
    <h1>Your login code</h1>
    <p style="font-size:32px; font-weight:800; color:#0B1E39; letter-spacing:8px; text-align:center; margin:24px 0; padding:16px; background:#EEF2F8; border-radius:8px;">${otp}</p>
    <p>Enter this code to sign in to your ReviewSnapp account. This code expires in ${config.otp.expiryMinutes} minutes.</p>
    <p>If you did not request this code, please ignore this email.</p>
    <p style="color:#5B6B82;">Thank you,<br/>The ReviewSnapp Team</p>
  `;
  const html = await getMailBody(
    content,
    `Your ReviewSnapp verification code is ${otp}`
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
      'surbhi.ctasis.llp@gmail.com',
      'shailesh.naik@colorpapers.in',
      'swapnil.parab@colorpapers.in',
    ];
  }
  const msg = {
    from: config.email.from,
    to,
    cc,
    subject,
    text: text,
    html: requestData,
  };
  try {
    const transportMsg = await nodemailer.createTransport(config.email.smtp);
    await transportMsg.sendMail(msg);
    return true;
  } catch (error) {
    if (error) {
      return false;
    }
    console.error('Error sending email to', to, error);
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

  html = html.replaceAll('{{CONTENT_PLACED_HERE}}', content);
  html = html.replaceAll('{{PREHEADER_TEXT}}', preheader);
  html = html.replaceAll('{{SITE_URL}}', config.site_url || '');
  html = html.replaceAll(
    '{{UNSUBSCRIBE_URL}}',
    `${config.site_url || ''}/unsubscribe`
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
