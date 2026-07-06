import { useState } from "react";
import { Link } from "react-router-dom";
import { resendVerificationEmail } from "../services/verificationApi";

function ResendVerificationPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        if (!email.trim()) {
            setStatus("error");
            setMessage("Please enter your email address.");
            return;
        }

        try {
            const response = await resendVerificationEmail(email);
            setStatus("success");
            setMessage(response.data.message || "Verification email sent! Please check your inbox.");
            setEmail("");
        } catch (error) {
            setStatus("error");
            setMessage(
                error.response?.data?.message ||
                "Failed to send verification email. Please try again."
            );
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "4rem", maxWidth: "400px", margin: "4rem auto" }}>
            <h1>Resend Verification Email</h1>
            <p>Enter your email address to receive a new verification link.</p>

            {status === "success" && (
                <div style={{ color: "green", marginBottom: "1rem" }}>
                    <p>✅ {message}</p>
                    <Link to="/login">Go to Login</Link>
                </div>
            )}

            {status !== "success" && (
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={status === "loading"}
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            marginBottom: "1rem",
                            fontSize: "1rem",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            fontSize: "1rem",
                            cursor: status === "loading" ? "not-allowed" : "pointer",
                        }}
                    >
                        {status === "loading" ? "Sending..." : "Send Verification Email"}
                    </button>
                </form>
            )}

            {status === "error" && (
                <p style={{ color: "red", marginBottom: "1rem" }}>❌ {message}</p>
            )}

            <p style={{ marginTop: "1rem" }}>
                Remember your password? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
}

export default ResendVerificationPage;
