import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import API from "../services/api";
import { useAlert } from "../contexts/AlertContext";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [message, setMessage] = useState("");
    const { showAlert } = useAlert();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        if (!email.trim()) {
            setStatus("error");
            const errorMsg = "Please enter your email address.";
            setMessage(errorMsg);
            showAlert(errorMsg, "error");
            return;
        }

        try {
            const response = await API.post("/auth/forgot-password", { email });
            setStatus("success");
            const successMsg = response.data.message || "Reset link sent! Please check your email.";
            setMessage(successMsg);
            showAlert(successMsg, "success");
            setEmail("");
        } catch (error) {
            setStatus("error");
            const errorMsg = error.response?.data?.message || "Failed to send reset link. Please try again.";
            setMessage(errorMsg);
            showAlert(errorMsg, "error");
        }
    };

    if (status === "success") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3">
                <div className="bg-(--color-card) backdrop-blur-[10px] border border-indigo-600/10 rounded-3xl py-10 px-[35px] w-full max-w-[420px] text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center">
                            <Mail className="w-8 h-8 text-(--color-primary)" />
                        </div>
                    </div>
                    <h1 className="mb-4 text-3xl font-semibold text-(--color-text)">Reset Link Sent!</h1>
                    <p className="text-(--color-muted) mb-8 text-base leading-relaxed">
                        We've sent a password reset link to your email address. Please check your inbox and click the link to reset your password.
                    </p>
                    <div className="space-y-4">
                        <Link
                            to="/login"
                            className="block w-full py-3 bg-(--color-primary) text-(--color-card) font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.20)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,black)] text-center"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3">
            <div className="bg-(--color-card) backdrop-blur-[10px] border border-indigo-600/10 rounded-3xl py-10 px-[35px] w-full max-w-[420px] text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
                <h1 className="mb-4 text-3xl font-semibold text-(--color-text)">Forgot Password</h1>
                <p className="register-subtitle mb-8 text-sm text-(--color-muted) leading-relaxed">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
                    <div className="flex flex-col text-left">
                        <div className="relative flex items-center bg-(--color-card) border border-indigo-600/15 rounded-xl px-4 py-2.5 transition-all duration-300 focus-within:border-(--color-primary) focus-within:ring-1 focus-within:ring-(--color-primary)">
                            <Mail className="w-5 h-5 text-(--color-primary) mr-3 flex-shrink-0" />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === "loading"}
                                className="w-full bg-transparent text-(--color-text) text-base placeholder-(--color-muted) outline-none border-none p-0"
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full py-3 bg-(--color-primary) text-(--color-card) font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.20)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,black)] flex items-center justify-center gap-2"
                    >
                        {status === "loading" ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Reset Link"
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 flex justify-center">
                    <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-(--color-muted) hover:text-(--color-primary) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
