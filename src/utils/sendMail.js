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
    return false;
  }
};

module.exports = sendMail;
