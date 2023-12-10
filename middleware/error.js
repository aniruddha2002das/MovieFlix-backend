exports.errorHandler = (err, req, res, next) => {
  // console.log('err:',err);
  res.status(500).send({ error: err.message || err });
};
