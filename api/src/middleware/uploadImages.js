const multer = require('multer');
const HttpError = require('../utils/httpError');

// Photos stay in memory and go straight to Cloudinary. Only JPG, PNG or WEBP, 5 MB each, up to 5 per request.
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter(req, file, cb) {
    if (!allowed.has(file.mimetype)) return cb(new HttpError(400, 'Only JPG, PNG or WEBP images are allowed'));
    cb(null, true);
  },
});

module.exports = upload.array('photos', 5);
