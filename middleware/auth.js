const jwt = require("jsonwebtoken");
const User = require("./../models/user");
require("dotenv").config();

exports.isAuth = async (req, res, next) => {
  const token = req.headers?.authorization;

  if(!token){
    return res.status(403).send({error: 'Invalid token!'});
  }

  const jwtToken = token.split("Bearer ")[1];

  if (!jwtToken)
    return res.status(403).send({
      error: "Invalid token",
    });

  const decode = jwt.verify(jwtToken, process.env.JWT_SECRET);
  const { userId } = decode;

  const user = await User.findById(userId);

  if (!user)
    return res.status(404).send({
      error: "Invalid token user not found!!",
    });

  req.user = user;
  next();
};

exports.isAdmin = async (req, res, next) => {
  const { user } = req;

  if (user.role !== "admin") {
    res.status(401).send({
      error: "Unothorized access!",
    });
  }

  next();
};
