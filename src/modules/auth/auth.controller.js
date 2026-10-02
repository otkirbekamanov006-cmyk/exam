const service = require('./auth.service');
const { sendSuccess } = require('../../utils/response');

const register = async (req, res) => {
  const user = await service.register(req.body);
  sendSuccess(res, { status: 201, message: 'Ro\'yxatdan o\'tdingiz. Emailingizga 6 xonali kod yuborildi', data: user });
};

const verify = async (req, res) => {
  await service.verify(req.body);
  sendSuccess(res, { message: 'Akkaunt muvaffaqiyatli tasdiqlandi' });
};

const resendCode = async (req, res) => {
  await service.resendCode(req.body);
  sendSuccess(res, { message: 'Yangi tasdiqlash kodi emailingizga yuborildi' });
};

const login = async (req, res) => {
  const data = await service.login(req.body);
  sendSuccess(res, { message: 'Tizimga muvaffaqiyatli kirdingiz', data });
};

const forgotPassword = async (req, res) => {
  await service.forgotPassword(req.body);
  sendSuccess(res, { message: 'Parolni tiklash kodi emailingizga yuborildi' });
};

const resetPassword = async (req, res) => {
  await service.resetPassword(req.body);
  sendSuccess(res, { message: 'Parol muvaffaqiyatli yangilandi' });
};

const me = async (req, res) => {
  sendSuccess(res, { data: req.user });
};

module.exports = { register, verify, resendCode, login, forgotPassword, resetPassword, me };
