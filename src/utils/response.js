// Muvaffaqiyatli API javoblarining barchasi bir xil tuzilishda qaytariladi.
const sendSuccess = (res, { status = 200, message, data, meta } = {}) => {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};

module.exports = { sendSuccess };
