const User = require("./../models/user");
const jwt = require("jsonwebtoken");
const EmailVerificationToken = require("./../models/EmailVarificationToken");
const PasswordResetToken = require("./../models/PasswordResetToken");
const crypto = require("crypto");
const { genarateOTP, sendEmail } = require("./../utils/email");
const { generateRandomBytes } = require("./../helpers/helper");
const { isValidObjectId } = require("mongoose");
const { log } = require("console");
require("dotenv").config();

exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;
  const oldUser = await User.findOne({ email });

  if (oldUser) {
    return res
      .status(401)
      .json({ error: "This mail address is already in use" });
  }

  const newUser = await User.create({
    name: name,
    email: email,
    password: password,
  });

  const OTP = genarateOTP();

  // store the OTP in db
  await EmailVerificationToken.create({ owner: newUser._id, token: OTP });

  const options = {
    OTP: OTP,
    email: newUser.email,
    subject: "Email Verification",
    message: `<p>Your Verification OTP</p>
                <h1>${OTP}</h1>`,
  };

  await sendEmail(options);

  res.status(201).send({
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
  });
};

exports.verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body;
  // console.log(OTP)
  if (!isValidObjectId(userId))
    return res.status(404).send({ error: "Invalid user!" });

  const user = await User.findById(userId);
  if (!user) return res.status(404).send({ error: "user not found!" });

  if (user.isVerified)
    return res.status(200).send({ error: "user is already verified!" });

  const token = await EmailVerificationToken.findOne({ owner: userId });
  if (!token) return res.status(404).send({ error: "token not found!" });

  const isMatched = await token.compareToken(OTP);
  if (!isMatched)
    return res.status(400).send({ error: "Please submit a valid OTP!" });

  user.isVerified = true;
  await user.save();

  await EmailVerificationToken.findByIdAndDelete(token._id);

  const options = {
    OTP: OTP,
    email: user.email,
    subject: "Welcome !! 🙂🙂🙂🙂",
    message: "<h1>Thanks For Visiting.😊😊😊 <h1> ",
  };

  //Send Welcome email
  await sendEmail(options);

  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  res.status(201).send({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      token: jwtToken,
      isVerified: user.isVerified,
      role: user.role
    },
    message: "Your email is verified !! 🙂🙂🙂",
  });
};

exports.resendEmailVerificationToken = async (req, res) => {
  console.log(req.body.userId);
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).send({ error: "User not found! 🙃🙃" });
  }
  if (user.isVerified)
    return res
      .status(200)
      .send({ error: "This mail is already verified!! 🙃🙃" });

  const alreadyHasToken = await EmailVerificationToken.findOne({
    owner: userId,
  });
  if (alreadyHasToken)
    return res.status(200).send({
      error: "Only after one hour you can request for another token!😞😞",
    });

  // generate 6 digits OTP.
  const OTP = genarateOTP();

  // store the OTP in db
  await EmailVerificationToken.create({ owner: user._id, token: OTP });

  // send the email
  const options = {
    OTP: OTP,
    email: user.email,
    subject: "Email Verification",
    message: `<p>Your Verification OTP</p>
                <h1>${OTP}</h1>`,
  };

  await sendEmail(options);

  res
    .status(200)
    .send({ message: "OTP is sent to your email. Check your email !!🙂🙂" });
};

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(404).send({ error: "Email is missing!!🙃🙃🙃" });

  const user = await User.findOne({ email: email });
  if (!user) return res.status(404).send({ error: "User not found !! 🙃🙃🙃" });

  const alreadyHasToken = await PasswordResetToken.findOne({ owner: user._id });
  if (alreadyHasToken)
    return res.status(400).send({
      error: "Only after one hour you can request for another token!😞😞",
    });

  const token = await generateRandomBytes();
  const newPasswordResetToken = await PasswordResetToken.create({
    owner: user._id,
    token: token,
  });

  const resetPasswordURL = `http://localhost:3000/auth/reset-password?token=${token}&id=${user._id}`;

  const options = {
    email: user.email,
    subject: "Reset Password Link.",
    message: `
    <p>Click here to reset password.</p>
    <a href='${resetPasswordURL}'>Click Here</a>
    `,
  };

  //Send Welcome email
  await sendEmail(options);

  res.status(200).send({ message: "Link sent to your email!! 🙂🙂" });
};

exports.sendResetPasseordTokenStatus = (req, res) => {
  res.status(200).send({ valid: true });
};

exports.resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body;

  const user = await User.findById(userId);
  const matched = await user.comparePassword(newPassword);

  if (matched)
    return res.status(200).send({
      error: "New password must be different from older one !!😌😌",
    });

  user.password = newPassword;
  await user.save();

  await PasswordResetToken.findByIdAndDelete(req.resetToken._id);

  const options = {
    email: user.email,
    subject: "Password Reset Successfully !! 🙂🙂🙂",
    message: `<h1>Password Reset Successfully.<h1>
    <p>Now you can use your new password.</p>`,
  };

  //Send Welcome email
  await sendEmail(options);

  res.status(200).send({ message: "Password Reset Successfully!!" });
};

exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).send({ error: "Email/Password is mismatch" });

  const matched = await user.comparePassword(password);
  if (!matched)
    return res.status(404).send({ error: "Email/Password is mismatch" });

  const { _id, name, role, isVerified } = user;

  const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);
  res
    .status(200)
    .send({
      user: { id: _id, name, email, role, token: jwtToken, isVerified},
    });
};
