const service = require('./categories.service');
const { sendSuccess } = require('../../utils/response');

const getAll = async (req, res) => {
  sendSuccess(res, { data: await service.getAll() });
};

const create = async (req, res) => {
  const data = await service.create(req.body);
  sendSuccess(res, { status: 201, message: 'Kategoriya yaratildi', data });
};

const update = async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  sendSuccess(res, { message: 'Kategoriya yangilandi', data });
};

const remove = async (req, res) => {
  await service.remove(req.params.id);
  sendSuccess(res, { message: 'Kategoriya o\'chirildi' });
};

module.exports = { getAll, create, update, remove };
