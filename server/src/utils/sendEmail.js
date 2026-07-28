const nodemailer = require("nodemailer");
const { Resend } = require("resend");

const sendEmail = async ({ to, subject, html }) => {
    // 1. Use Resend HTTP API if RESEND_API_KEY is configured
    // This is highly recommended for hosting environments like Render (Free tier),
    // which block outbound SMTP ports (25, 465, 587) but permit standard HTTPS.
    if (process.env.RESEND_API_KEY) {
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const data = await resend.emails.send({
                from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                to,
                subject,
                html,
            });
            return data;
        } catch (error) {
            console.error("Resend API failed to send email, falling back to SMTP if configured", error);
        }
    }

    // 2. Fallback to standard SMTP (Nodemailer)
    const port = parseInt(process.env.EMAIL_PORT) || 587;
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
