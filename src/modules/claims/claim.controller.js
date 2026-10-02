const ClaimService = require('./claim.service');

exports.getMyClaims = async (req, res, next) => {
  try {
    const claims = await ClaimService.getMyClaims(req.user.id);
    res.status(200).json({ success: true, data: claims });
  } catch (error) {
    next(error);
  }
};

exports.getItemClaims = async (req, res, next) => {
  try {
    const claims = await ClaimService.getItemClaims(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: claims });
  } catch (error) {
    next(error);
  }
};

exports.createClaim = async (req, res, next) => {
  try {
    const claim = await ClaimService.createClaim(
      req.params.id,
      req.user.id,
      req.body.answer,
      req.body.message
    );
    res.status(201).json({ success: true, message: "Da'vo yuborildi", data: claim });
  } catch (error) {
    next(error);
  }
};

exports.approveClaim = async (req, res, next) => {
  try {
    const result = await ClaimService.approveClaim(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

exports.rejectClaim = async (req, res, next) => {
  try {
    const result = await ClaimService.rejectClaim(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};