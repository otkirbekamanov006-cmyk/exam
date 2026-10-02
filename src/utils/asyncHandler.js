// async controllerlarda yuz bergan xatolarni avtomatik ravishda umumiy xato ishlovchisiga uzatadi.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
