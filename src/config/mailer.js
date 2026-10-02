const nodemailer = require('nodemailer');
const { smtp } = require('./env');

const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  secure: smtp.secure,
  auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
});

module.exports = { transporter, from: smtp.from };
