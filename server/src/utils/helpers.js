const crypto = require('crypto');

exports.asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

exports.httpError = (status, message) => {
  const e = new Error(message);
  e.status = status;
  return e;
};

exports.ticketCode = () => 'EVT-' + crypto.randomBytes(3).toString('hex').toUpperCase();
exports.txnId = () => 'TXN' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();

exports.toCsv = (rows, columns) => {
  const esc = (v) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(c.value(r))).join(','));
  return [head, ...body].join('\n');
};
