const service = require('./claims.service');
const { sendSuccess } = require('../../utils/response');

const create = async (req, res) => {
  const data = await service.create(req.params.id, req.user, req.body);
  sendSuccess(res, { status: 201, message: 'Javob to\'g\'ri! Da\'vo e\'lon egasiga yuborildi', data });
};

const listForItem = async (req, res) => {
  sendSuccess(res, { data: await service.listForItem(req.params.id, req.user) });
};

const listMine = async (req, res) => {
  sendSuccess(res, { data: await service.listMine(req.user.id) });
};

const approve = async (req, res) => {
  const data = await service.approve(req.params.id, req.user);
  sendSuccess(res, { message: 'Da\'vo tasdiqlandi, e\'lon "returned" holatiga o\'tdi', data });
};

const reject = async (req, res) => {
  const data = await service.reject(req.params.id, req.user);
  sendSuccess(res, { message: 'Da\'vo rad etildi', data });
};

module.exports = { create, listForItem, listMine, approve, reject };
