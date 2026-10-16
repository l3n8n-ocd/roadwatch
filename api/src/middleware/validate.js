const HttpError = require('../utils/httpError');

// validate(zodSchema, 'body' | 'query' | 'params'). Replaces the request part with the parsed (cleaned) value.
module.exports = (schema, part = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[part]);
  if (!parsed.success) {
    return next(new HttpError(400, 'Validation failed', parsed.error.flatten().fieldErrors));
  }
  if (part === 'query') req.validQuery = parsed.data;
  else req[part] = parsed.data;
  next();
};
