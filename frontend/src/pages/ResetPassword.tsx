import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/common/Button";
import { useState, useEffect } from "react";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LockResetIcon from "@mui/icons-material/LockReset";
import { auth, ApiError } from "../services/api";

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Extract token from URL (Supabase usually puts it in the hash or query params)
        const hash = location.hash;
        const params = new URLSearchParams(hash.replace("#", "?") || location.search);
        const accessToken = params.get("access_token");

        if (accessToken) {
            setToken(accessToken);
        } else {
            setError("Invalid or expired reset link. Please request a new one.");
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError("No reset token found. Please use the link from your email.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const form = e.target as HTMLFormElement;
        const password = (form.elements[0] as HTMLInputElement).value;
        const confirmPassword = (form.elements[1] as HTMLInputElement).value;

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            await auth.resetPassword(password, token);
            setIsSuccess(true);
            // Optional: Clear token from URL/state
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Failed to reset password. The link may have expired.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-bg-primary overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Left Side - Hero Section */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative z-10">
                <div className="max-w-xl animate-fade-in">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-6">
                        Reset Your Password
                    </h1>
                    <p className="text-lg text-text-secondary leading-relaxed mb-8">
                        Choose a strong password to keep your account and projects secure.
                        We recommend using a mix of letters, numbers, and symbols.
                    </p>
                    <div className="glass p-6 rounded-2xl border border-glass-border">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                                <LockResetIcon />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Security First</h3>
                        </div>
                        <p className="text-text-secondary text-sm">
                            Your security is our priority. Once you reset your password, you'll be able to log back in and continue your work.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 z-10">
                <div className="w-full max-w-md animate-slide-up">
                    <div className="glass-card p-8 md:p-10 border border-glass-border">
                        {!isSuccess ? (
                            <>
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-bold text-text-primary mb-2">
                                        New Password
                                    </h2>
                                    <p className="text-text-secondary">
                                        Please enter your new password below
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary ml-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 rounded-xl bg-bg-secondary/50 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-gray-600"
                                            placeholder="••••••••"
                                            required
                                            disabled={!token}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary ml-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 rounded-xl bg-bg-secondary/50 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-gray-600"
                                            placeholder="••••••••"
                                            required
                                            disabled={!token}
                                        />
                                    </div>

                                    <Button
                                        text="Reset Password"
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-full mt-4"
                                        isLoading={isLoading}
                                        disabled={!token}
                                        icon={<ArrowForwardIosIcon fontSize="small" />}
                                    />
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ArrowForwardIosIcon className="rotate-[-90deg]" />
                                </div>
                                <h2 className="text-2xl font-bold text-text-primary mb-4">Password Reset!</h2>
                                <p className="text-text-secondary mb-8">
                                    Your password has been successfully updated. Redirecting you to the login page...
                                </p>
                                <Button
                                    text="Go to Login"
                                    onClick={() => navigate("/login")}
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                />
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-text-secondary">
                            Remember your password?{" "}
                            <a
                                onClick={() => navigate("/login")}
                                className="text-accent font-bold hover:underline cursor-pointer"
                            >
                                Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
