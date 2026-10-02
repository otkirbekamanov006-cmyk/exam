<<<<<<< HEAD
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
=======
const AuthService = require('./auth.service');

exports.register = async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json({
      success: true,
      message: "Ro'yxatdan o'tdingiz. Emailingizga tasdiqlash kodi yuborildi",
      data: result.user,
      ...(result.devCode && { devCode: result.devCode })
    });
  } catch (error) {
    next(error);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const result = await AuthService.verify(req.body);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

exports.resendCode = async (req, res, next) => {
  try {
    const result = await AuthService.resendCode(req.body);
    res.status(200).json({
      success: true,
      message: result.message,
      ...(result.devCode && { devCode: result.devCode })
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const data = await AuthService.login(req.body);
    res.status(200).json({
      success: true,
      message: 'Tizimga muvaffaqiyatli kirdingiz',
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const result = await AuthService.forgotPassword(req.body);
    res.status(200).json({
      success: true,
      message: result.message,
      ...(result.devCode && { devCode: result.devCode })
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const result = await AuthService.resetPassword(req.body);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await AuthService.getUserById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
>>>>>>> 76df369 (faylni ozgartrdim)
