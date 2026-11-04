// require('dotenv').config();
// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     type: 'OAuth2',
//     user: process.env.EMAIL_USER,
//     clientId: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     refreshToken: process.env.REFRESH_TOKEN,
//   },
// });

// // Verify the connection configuration
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('Error connecting to email server:', error);
//   } else {
//     console.log('Email server is ready to send messages');
//   }
// });

// // Function to send email
// const sendEmail = async (to, subject, text, html) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
//       to, // list of receivers
//       subject, // Subject line
//       text, // plain text body
//       html, // html body
//     });

//     console.log('Message sent: %s', info.messageId);
//     console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
//   } catch (error) {
//     console.error('Error sending email:', error);
//   }
// };


// async function sendRegistrationEmail(userEmail, name) {
//     const subject = 'Welcome to Backend Ledger !';
//     const text = `Hello ${name}, \n\nThank you for registering at Backend Ledger. We're excited to have you on board! \n\nBest regards, \nThe Backend Ledger Team`;
//     const html = `<p>Hello ${name}, </p><p>Thank you for registering at Backend Ledger. We're excited to have you on board! </p><p>Best regards, <br>The Backend Ledger Team</p>` ;

//     await sendEmail(userEmail, subject, text, html);
// }


// async function sendTransactionEmail(userEmail, name, account, toAccount) {
//   const subject = 'TransactionSuccessful';
//   const text = `Hello ${name}, \n\nYou transaction of $${amount} to account ${toAccount} was successful.\n\nBest regards, \nThe backend ledger Team`;

//   const html = `<p>Hello ${name}, </p><p>Your transaction of $${amount} to account ${toAccount} was successful. </p><p>Best regards,<br>The Backend Ledger Team</br>`;

//   await sendEmail(userEmail, subject, text, html);
// }

// async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
//   const subject = 'Transaction Failed';
//   const text = `Hello ${name}, \n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} has been failed. `;
//   const html = `<p>Hello ${name}, </p><p>Your transaction of $${amount} to account ${toAccount} was failed. </p><p>Best regards,<br>The Backend Ledger Team</br>`;

//   await sendEmail(userEmail, subject, text, html);
// }



// module.exports = {
//     sendRegistrationEmail,
//     sendTransactionEmail,
//     sendTransactionFailureEmail
// };




require("dotenv").config();
const nodemailer = require("nodemailer");

// Gmail OAuth2 transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify email configuration
transporter.verify()
    .then(() => {
        console.log("Email server is ready to send messages");
    })
    .catch((error) => {
        console.error("Email server authentication failed:", error.message);
    });


// Common email sending function
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log("Email sent successfully:", info.messageId);

        return info;

    } catch (error) {
        console.error("Error sending email:", error.message);

        // Do not crash the main application
        return null;
    }
};


// Registration email
async function sendRegistrationEmail(userEmail, name) {

    const subject = "Welcome to Backend Ledger!";

    const text = `Hello ${name},

Thank you for registering at Backend Ledger.
We're excited to have you on board!

Best regards,
The Backend Ledger Team`;

    const html = `
        <p>Hello ${name},</p>
        <p>Thank you for registering at Backend Ledger.
        We're excited to have you on board!</p>
        <p>Best regards,<br>The Backend Ledger Team</p>
    `;

    return await sendEmail(userEmail, subject, text, html);
}


// Successful transaction email
async function sendTransactionEmail(userEmail, name, amount, toAccount) {

    const subject = "Transaction Successful";

    const text = `Hello ${name},

Your transaction of $${amount} to account ${toAccount} was successful.

Best regards,
The Backend Ledger Team`;

    const html = `
        <p>Hello ${name},</p>
        <p>Your transaction of $${amount} to account
        ${toAccount} was successful.</p>
        <p>Best regards,<br>The Backend Ledger Team</p>
    `;

    return await sendEmail(userEmail, subject, text, html);
}


// Failed transaction email
async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {

    const subject = "Transaction Failed";

    const text = `Hello ${name},

We regret to inform you that your transaction of $${amount}
to account ${toAccount} has failed.

Best regards,
The Backend Ledger Team`;

    const html = `
        <p>Hello ${name},</p>
        <p>Your transaction of $${amount} to account
        ${toAccount} has failed.</p>
        <p>Best regards,<br>The Backend Ledger Team</p>
    `;

    return await sendEmail(userEmail, subject, text, html);
}


module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail,
};
