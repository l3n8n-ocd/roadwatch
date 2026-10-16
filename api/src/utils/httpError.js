// Throw this from controllers; the error handler turns it into a JSON response.
module.exports = class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
};
