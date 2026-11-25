function notFound(req, res) { res.status(404).json({ message: 'API route not found.' }); }
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'PDF is too large. Please upload a smaller file.' });
  const status = err.status || 500;
  res.status(status).json({ message: status === 500 ? 'Something went wrong on the server.' : err.message });
}
module.exports = { notFound, errorHandler };
