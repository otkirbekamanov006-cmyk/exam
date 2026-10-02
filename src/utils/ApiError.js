<<<<<<< HEAD
// Biznes mantiqidagi xatolarni HTTP holat kodi bilan qaytarish uchun maxsus klass.
class ApiError extends Error {
  constructor(statusCode, message, errors) {
=======
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
>>>>>>> 76df369 (faylni ozgartrdim)
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
<<<<<<< HEAD

  static badRequest(message, errors) { return new ApiError(400, message, errors); }
  static unauthorized(message = 'Avtorizatsiyadan o\'tilmagan') { return new ApiError(401, message); }
  static forbidden(message = 'Bu amal uchun ruxsat yo\'q') { return new ApiError(403, message); }
  static notFound(message = 'Topilmadi') { return new ApiError(404, message); }
  static conflict(message) { return new ApiError(409, message); }
  static tooMany(message) { return new ApiError(429, message); }
}

module.exports = ApiError;
=======
}

module.exports = ApiError;
>>>>>>> 76df369 (faylni ozgartrdim)
