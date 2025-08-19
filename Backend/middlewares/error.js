export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode ;
  res.status(statusCode);
  res.json({
    success: false,
    error: err.message,
  });
};
