const express = require('express');
const router = express.Router();
const {createUser,signIn,verifyEmail,resendEmailVerificationToken,forgetPassword,resetPassword,sendResetPasseordTokenStatus} = require('./../controllers/user');
const {userValidator,signInValidator,validatePassword,validate} = require('./../middleware/validator');
const {isValidPassResetToken} = require('./../middleware/user');
const { isAuth } = require('./../middleware/auth');

router.post('/create',userValidator,validate,createUser);
router.post('/sign-in',signInValidator,validate,signIn);
router.post('/verify-email',verifyEmail);
router.post('/resend-email-verification-token',resendEmailVerificationToken);
router.post('/forget-password',forgetPassword);
router.post('/verify-pass-reset-token',isValidPassResetToken,sendResetPasseordTokenStatus); 
router.post('/reset-password',isValidPassResetToken,validatePassword,validate,resetPassword);


router.get('/is-auth',isAuth,(req,res) => {
    const { user } = req;
    res.status(200).send({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role
        }
    })
})

module.exports = router;