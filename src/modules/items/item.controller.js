const ItemService = require('./item.service');

exports.createItem = async (req, res, next) => {
  try {
    const item = await ItemService.createItem(req.user.id, req.body, req.files);
    res.status(201).json({ success: true, message: "E'lon yaratildi", data: item });
  } catch (error) {
    next(error);
  }
};

exports.getItems = async (req, res, next) => {
  try {
    const result = await ItemService.getItems(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

exports.getMyItems = async (req, res, next) => {
  try {
    const items = await ItemService.getMyItems(req.user.id);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

exports.getItemById = async (req, res, next) => {
  try {
    const item = await ItemService.getItemById(req.params.id);
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const item = await ItemService.updateItem(req.params.id, req.user.id, req.user.role, req.body);
    res.status(200).json({ success: true, message: "E'lon yangilandi", data: item });
  } catch (error) {
    next(error);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    await ItemService.deleteItem(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, message: "E'lon o'chirildi" });
  } catch (error) {
    next(error);
  }
};

exports.reportItem = async (req, res, next) => {
  try {
    const result = await ItemService.reportItem(req.params.id, req.user.id, req.body.message);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};