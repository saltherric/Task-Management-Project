import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import API from "../services/api";
import { useAlert } from "../contexts/AlertContext";

function VerifyEmailPage() {
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");
    const { showAlert } = useAlert();
    const hasCalled = useRef(false);

    useEffect(() => {
        if (hasCalled.current) return;
        hasCalled.current = true;

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
        <div className="flex min-h-screen flex-col items-center justify-center gap-3">
            <div className="bg-(--color-card) backdrop-blur-[10px] border border-indigo-600/10 rounded-3xl py-10 px-[35px] w-full max-w-[420px] text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
                
                {status === "loading" && (
                    <div className="flex flex-col items-center">
                        <div className="flex justify-center mb-6">
                            <Loader2 className="w-12 h-12 text-(--color-primary) animate-spin" />
                        </div>
                        <h1 className="mb-4 text-2xl font-semibold text-(--color-text)">Verifying Email</h1>
                        <p className="text-(--color-muted) text-sm leading-relaxed">
                            Please wait while we confirm your verification link and activate your account.
                        </p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                        </div>
                        <h1 className="mb-4 text-3xl font-semibold text-(--color-text)">Verified!</h1>
                        <p className="text-(--color-muted) mb-8 text-sm leading-relaxed">
                            Your email has been verified successfully! You can now log in and start managing your tasks.
                        </p>
                        <Link
                            to="/login"
                            className="block w-full py-3 bg-(--color-primary) text-(--color-card) font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.20)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,black)] text-center"
                        >
                            Go to Login
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                        </div>
                        <h1 className="mb-4 text-2xl font-semibold text-(--color-text)">Verification Failed</h1>
                        <p className="text-(--color-muted) mb-8 text-sm leading-relaxed">
                            {message || "The verification link is invalid or has expired."}
                        </p>
                        <div className="w-full space-y-3">
                            <Link
                                to="/resend-verification"
                                className="block w-full py-3 bg-(--color-primary) text-(--color-card) font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.20)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,black)] text-center"
                            >
                                Request New Link
                            </Link>
                            <Link
                                to="/login"
                                className="mt-4 block text-sm text-(--color-muted) hover:text-(--color-primary) transition-colors font-semibold hover:underline"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VerifyEmailPage;