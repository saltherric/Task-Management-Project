import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function VerifyEmailPage() {
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verifyEmail = async () => {
            const token = new URLSearchParams(window.location.search).get("token");

            if (!token) {
                setMessage("Verification token is missing.");
                setStatus("error");
                return;
            }

            try {
                await API.get(`/auth/verify-email?token=${token}`);
                setStatus("success");
            } catch (error) {
                setMessage(
                    error.response?.data?.message ||
                    "Verification failed."
                );
                setStatus("error");
            }
        };

        verifyEmail();
    }, []);

    return (
        <div style={{ textAlign: "center", marginTop: "4rem" }}>
            {status === "loading" && <p>Verifying your email...</p>}

            {status === "success" && (
                <>
                    <p>✅ Your email has been verified!</p>
                    <Link to="/login">Go to Login</Link>
                </>
            )}

            {status === "error" && (
                <>
                    <p>❌ {message}</p>
                    <Link to="/resend-verification">
                        Request a new verification email
                    </Link>
                </>
            )}
        </div>
    );
}

export default VerifyEmailPage;