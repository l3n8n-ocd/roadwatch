const multer = require('multer');

// One JSON error shape for the whole API: { success: false, error, details? }
module.exports = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  let message = err.message;
  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be 5 MB or smaller' : err.message;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = 'That value is already in use';
  }
  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }
  res.status(status).json({ success: false, error: message, ...(err.details ? { details: err.details } : {}) });
};
