const { isValidObjectId } = require('mongoose');
const PasswordResetToken = require('./../models/PasswordResetToken');

exports.isValidPassResetToken = async (req,res,next) => {
    const {token, userId} = req.body;

    if(!token){
        return res.status(403).send({error: "Invalid Request !! 🙃🙃🙃"}); // 
    }

    if(!token.trim() || !isValidObjectId(userId)) {
        return res.status(401).send({error: "Invalid Request !! 🙃🙃🙃"});
    }

    const resetToken = await PasswordResetToken.findOne({owner: userId});
    if(!resetToken) {
        return res.status(401).send({error: "Unothorized Access !! Invalid Request !! 🙃🙃🙃"});
    }

    // console.log(resetToken);

    const matched = await resetToken.compareToken(token);
    if(!matched) {
        return res.status(401).send({error: "Unothorized Access !! Invalid Request !! 🙃🙃🙃"});
    }

    // todo How is it working?
    req.resetToken = resetToken;

    // console.log(req.resetToken);

    next();
};

