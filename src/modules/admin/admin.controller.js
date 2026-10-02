const service = require('./admin.service');
const { sendSuccess } = require('../../utils/response');

const stats = async (req, res) => {
  sendSuccess(res, { data: await service.getStats() });
};

module.exports = { stats };
