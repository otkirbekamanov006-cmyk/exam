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