const service = require('./items.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res) => {
  const { data, meta } = await service.list(req.validatedQuery);
  sendSuccess(res, { data, meta });
};

const listMine = async (req, res) => {
  sendSuccess(res, { data: await service.listMine(req.user.id) });
};

const getOne = async (req, res) => {
  sendSuccess(res, { data: await service.getById(req.params.id) });
};

const create = async (req, res) => {
  const data = await service.create(req.user.id, req.body, req.files);
  sendSuccess(res, { status: 201, message: 'E\'lon yaratildi', data });
};

const update = async (req, res) => {
  const data = await service.update(req.params.id, req.user, req.body);
  sendSuccess(res, { message: 'E\'lon yangilandi', data });
};

const remove = async (req, res) => {
  await service.remove(req.params.id, req.user);
  sendSuccess(res, { message: 'E\'lon o\'chirildi' });
};

const report = async (req, res) => {
  await service.report(req.params.id, req.user, req.body);
  sendSuccess(res, { message: 'Xabaringiz e\'lon egasiga yuborildi' });
};

module.exports = { list, listMine, getOne, create, update, remove, report };
