const { Resend } = require("resend");

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        throw new Error("Missing RESEND_API_KEY");
    }

    return new Resend(apiKey);
};

async function sendVerificationEmail(toEmail, token) {
    const verifyUrl = `${process.env.CLIENT_URL}/api/auth/verify-email?token=${token}`;
    const resend = getResendClient();

    await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: "Verify your email",
        html: `
            <p>Click below to verify your email:</p>
            <a href="${verifyUrl}">${verifyUrl}</a>
            <p>This link expires in 1 hour.</p>
        `,
    });
}

module.exports = { sendVerificationEmail };