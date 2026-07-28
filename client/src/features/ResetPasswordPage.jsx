import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import API from "../services/api";
import { useAlert } from "../contexts/AlertContext";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const token = new URLSearchParams(window.location.search).get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState({});
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validate = () => {
        const tempErrors = {};
        if (!password) {
            tempErrors.password = "Please enter a new password.";
        } else if (password.length < 6) {
            tempErrors.password = "Password must be at least 6 characters.";
        }

        if (!confirmPassword) {
            tempErrors.confirmPassword = "Please confirm your password.";
        } else if (password !== confirmPassword) {
            tempErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        if (!token) {
            const errorMsg = "Reset token is missing.";
            setMessage(errorMsg);
            setStatus("error");
            showAlert(errorMsg, "error");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            const response = await API.post("/auth/reset-password", { token, password });
            setStatus("success");
            const successMsg = response.data.message || "Password reset successful!";
            setMessage(successMsg);
            showAlert(successMsg, "success");
        } catch (error) {
            setStatus("error");
            const errorMsg = error.response?.data?.message || "Failed to reset password.";
            setMessage(errorMsg);
            showAlert(errorMsg, "error");
        }
    };

    if (status === "success") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3">
                <div className="bg-(--color-card) backdrop-blur-[10px] border border-indigo-600/10 rounded-3xl py-10 px-[35px] w-full max-w-[420px] text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                    <h1 className="mb-4 text-3xl font-semibold text-(--color-text)">Reset Successful!</h1>
                    <p className="text-(--color-muted) mb-8 text-sm leading-relaxed">
                        Your password has been successfully reset. You can now log in with your new credentials.
                    </p>
                    <Link
                        to="/login"
                        className="block w-full py-3 bg-(--color-primary) text-(--color-card) font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.20)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,black)] text-center"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3">
            <div className="bg-(--color-card) backdrop-blur-[10px] border border-indigo-600/10 rounded-3xl py-10 px-[35px] w-full max-w-[420px] text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
                <h1 className="mb-4 text-3xl font-semibold text-(--color-text)">Reset Password</h1>
                <p className="register-subtitle mb-8 text-sm text-(--color-muted) leading-relaxed">
                    Please enter your new password below.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password Input */}
                    <div className="flex flex-col text-left">
                        <div className="relative flex items-center bg-(--color-card) border border-indigo-600/15 rounded-xl px-4 py-2.5 transition-all duration-300 focus-within:border-(--color-primary) focus-within:ring-1 focus-within:ring-(--color-primary)">
                            <Lock className="w-5 h-5 text-(--color-primary) mr-3 flex-shrink-0" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                                }}
                                disabled={status === "loading"}
                                className="w-full bg-transparent text-(--color-text) text-base placeholder-(--color-muted) outline-none border-none p-0 pr-8"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 text-(--color-muted) hover:text-(--color-primary) transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && <span className="text-red-500 text-xs mt-1.5 ml-3">{errors.password}</span>}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="flex flex-col text-left">
                        <div className="relative flex items-center bg-(--color-card) border border-indigo-600/15 rounded-xl px-4 py-2.5 transition-all duration-300 focus-within:border-(--color-primary) focus-within:ring-1 focus-within:ring-(--color-primary)">
                            <Lock className="w-5 h-5 text-(--color-primary) mr-3 flex-shrink-0" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
                                }}
                                disabled={status === "loading"}
                                className="w-full bg-transparent text-(--color-text) text-base placeholder-(--color-muted) outline-none border-none p-0 pr-8"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 text-(--color-muted) hover:text-(--color-primary) transition-colors cursor-pointer"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.confirmPassword && <span className="text-red-500 text-xs mt-1.5 ml-3">{errors.confirmPassword}</span>}
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
                                Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </form>

                {status === "error" && (
                    <div className="mt-6 flex flex-col items-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                        <p className="text-red-500 text-sm">{message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage;
