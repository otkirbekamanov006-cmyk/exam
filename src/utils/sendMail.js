<<<<<<< HEAD
const { transporter, from } = require('../config/mailer');

/**
 * Elektron xat yuboradi. Xato yuz bersa server to'xtamaydi, xabar jurnalga yoziladi.
 * @returns {Promise<boolean>} Xat yuborilgan bo'lsa true, aks holda false qaytaradi.
 */
const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({ from, to, subject, html });
    console.log(`📧 Email yuborildi: ${to} — ${subject}`);
    return true;
  } catch (err) {
    console.error(`📧 Email yuborilmadi (${to}): ${err.message}`);
=======
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Topildi Platformasi" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email yuborildi: ${to}`);
    return true;
  } catch (error) {
    console.error('Email yuborishda xatolik:', error.message);
>>>>>>> 76df369 (faylni ozgartrdim)
    return false;
  }
};

<<<<<<< HEAD
module.exports = sendMail;
=======
// ─── Email shablonlari ────────────────────────────────────────────────────────

const baseLayout = (content) => `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #2563EB, #1d4ed8); padding: 28px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 26px; letter-spacing: 1px; }
    .header p { color: #bfdbfe; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; color: #374151; line-height: 1.7; }
    .body h2 { color: #1e40af; margin-top: 0; }
    .code-box { background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 16px 24px; text-align: center; margin: 20px 0; }
    .code-box span { font-size: 36px; font-weight: bold; color: #1d4ed8; letter-spacing: 8px; }
    .info-card { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .info-card p { margin: 4px 0; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
    .footer { background: #f8fafc; padding: 16px 32px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
    .btn { display: inline-block; background: #2563EB; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🔍 Topildi</h1>
      <p>Yo'qolgan va topilgan buyumlar platformasi</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© 2026 Topildi Platform · Barcha huquqlar himoyalangan</p>
      <p>Bu xabar avtomatik yuborilgan. Iltimos, javob bermang.</p>
    </div>
  </div>
</body>
</html>
`;

exports.otpTemplate = (name, code, purpose) => {
  const title = purpose === 'verify' ? 'Akkountni tasdiqlash' : 'Parolni tiklash';
  const desc = purpose === 'verify'
    ? 'Akkountingizni tasdiqlash uchun quyidagi kodni kiriting:'
    : 'Parolni tiklash uchun quyidagi kodni kiriting:';
  return baseLayout(`
    <h2>${title}</h2>
    <p>Salom, <strong>${name}</strong>!</p>
    <p>${desc}</p>
    <div class="code-box"><span>${code}</span></div>
    <p>⏰ Kod <strong>5 daqiqa</strong> davomida amal qiladi. Agar siz bu amalni bajarmagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.</p>
  `);
};

exports.claimReceivedTemplate = (ownerName, itemTitle, claimantName, claimantMessage) => baseLayout(`
  <h2>📬 E'loningizga da'vo keldi!</h2>
  <p>Salom, <strong>${ownerName}</strong>!</p>
  <p>«<strong>${itemTitle}</strong>» e'loningizga yangi da'vo keldi:</p>
  <div class="info-card">
    <p>👤 Da'vogar: <strong>${claimantName}</strong></p>
    ${claimantMessage ? `<p>💬 Xabar: ${claimantMessage}</p>` : ''}
  </div>
  <p>Platformaga kirib da'voni ko'rib chiqing va tasdiqlang yoki rad eting.</p>
`);

exports.claimApprovedTemplate = (recipientName, otherPersonName, otherPersonPhone, isOwner) => baseLayout(`
  <h2>🎉 Da'vo tasdiqlandi!</h2>
  <p>Salom, <strong>${recipientName}</strong>!</p>
  <p>${isOwner ? 'Siz da\'voni tasdiqladingiz. Da\'vogarning aloqa ma\'lumotlari:' : 'Sizning da\'vongiz tasdiqlandi! Buyum egasining aloqa ma\'lumotlari:'}</p>
  <div class="info-card">
    <p>👤 Ism: <strong>${otherPersonName}</strong></p>
    <p>📞 Telefon: <strong>${otherPersonPhone}</strong></p>
  </div>
  <p>Buyumni qaytarish uchun aloqaga chiqing. Omad tilaymiz! 🌟</p>
`);

exports.claimRejectedTemplate = (claimantName, itemTitle) => baseLayout(`
  <h2>❌ Da'vo rad etildi</h2>
  <p>Salom, <strong>${claimantName}</strong>!</p>
  <p>Afsuski, «<strong>${itemTitle}</strong>» e'loniga yuborgan da'vongiz rad etildi.</p>
  <p>Agar buyum sizniki ekanligiga ishonchingiz komil bo'lsa, e'lon egasi bilan bog'laning.</p>
`);

exports.reportReceivedTemplate = (ownerName, itemTitle, finderName, finderPhone, message) => baseLayout(`
  <h2>🔔 Buyumingizni topishdi!</h2>
  <p>Salom, <strong>${ownerName}</strong>!</p>
  <p>«<strong>${itemTitle}</strong>» e'loniz bo'yicha kimdir "Men topdim" tugmasini bosdi:</p>
  <div class="info-card">
    <p>👤 Topgan kishi: <strong>${finderName}</strong></p>
    <p>📞 Telefon: <strong>${finderPhone}</strong></p>
    ${message ? `<p>💬 Xabar: ${message}</p>` : ''}
  </div>
  <p>Buyumingizni qaytarish uchun aloqaga chiqing!</p>
`);

module.exports = {
  sendMail,
  otpTemplate: exports.otpTemplate,
  claimReceivedTemplate: exports.claimReceivedTemplate,
  claimApprovedTemplate: exports.claimApprovedTemplate,
  claimRejectedTemplate: exports.claimRejectedTemplate,
  reportReceivedTemplate: exports.reportReceivedTemplate
};
>>>>>>> 76df369 (faylni ozgartrdim)
