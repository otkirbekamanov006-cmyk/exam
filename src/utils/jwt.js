const jwt = require('jsonwebtoken');
const { jwt: cfg } = require('../config/env');

const signToken = (user) => jwt.sign({ id: user.id, role: user.role }, cfg.secret, { expiresIn: cfg.expiresIn });
const verifyToken = (token) => jwt.verify(token, cfg.secret);

module.exports = { signToken, verifyToken };
