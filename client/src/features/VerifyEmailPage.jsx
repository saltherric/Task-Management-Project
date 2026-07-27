import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAlert } from "../contexts/AlertContext";

function VerifyEmailPage() {
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");
    const { showAlert } = useAlert();

    useEffect(() => {
        const verifyEmail = async () => {
            const token = new URLSearchParams(window.location.search).get("token");

            if (!token) {
                const errorMsg = "Verification token is missing.";
                setMessage(errorMsg);
                setStatus("error");
                showAlert(errorMsg, "error");
                return;
            }

            try {
                await API.get(`/auth/verify-email?token=${token}`);
                setStatus("success");
                showAlert("Your email has been verified successfully!", "success");
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Verification failed.";
                setMessage(errorMsg);
                setStatus("error");
                showAlert(errorMsg, "error");
            }
        };

        verifyEmail();
    }, [showAlert]);

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