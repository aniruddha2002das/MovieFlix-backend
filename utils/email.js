const nodemailer = require("nodemailer");

exports.genarateOTP = (otp_length = 6) => {
    // generate 6 digits OTP.
    let OTP = '';
    for (let i = 0; i < otp_length; i++) {
        const randomVal = Math.round(Math.random() * 9);
        OTP += randomVal;
    }

    return OTP;
};


exports.sendEmail = async (options) => {

    // 1.) Create a transporter
    let transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 587,
        auth: {
            user: process.env.MAIL_TRAP_USER,
            pass: process.env.MAIL_TRAP_PASSWORD
        }
    });

    // 2.) Define the email options
    const mailOptions = {
        from: 'Aniruddha Das <foo@example.com>',
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    // // 3.) Actually send the email
    await transporter.sendMail(mailOptions);
}


