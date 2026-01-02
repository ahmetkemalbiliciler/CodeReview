import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import { useState } from "react";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { auth, ApiError } from "../services/api";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = e.target as HTMLFormElement;
        const email = (form.elements[0] as HTMLInputElement).value;

        try {
            await auth.forgotPassword({ email });
            setIsSubmitted(true);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-bg-primary overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Left Side - Hero Section (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative z-10 order-2">
                <div className="max-w-xl animate-fade-in">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-6">
                        Secure Your Account
                    </h1>
                    <p className="text-lg text-text-secondary leading-relaxed mb-8">
                        Don't worry, it happens to the best of us. We'll help you get back into your account in no time.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 glass p-4 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                                <ArrowForwardIosIcon fontSize="small" />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary">Request Reset</h3>
                                <p className="text-sm text-text-secondary">Enter your email to receive a reset link.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 glass p-4 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                                <ArrowForwardIosIcon fontSize="small" />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary">Check Email</h3>
                                <p className="text-sm text-text-secondary">Follow the instructions sent to your inbox.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 z-10 order-1">
                <div className="w-full max-w-md animate-slide-up">
                    <div className="glass-card p-8 md:p-10 border border-glass-border">
                        {!isSubmitted ? (
                            <>
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-text-primary mb-2">
                                        Forgot Password?
                                    </h2>
                                    <p className="text-text-secondary">
                                        Enter your email to reset your password
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary ml-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 rounded-xl bg-bg-secondary/50 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-gray-600"
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            text="Send Reset Link"
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            className="w-full"
                                            isLoading={isLoading}
                                            icon={<ArrowForwardIosIcon fontSize="small" />}
                                        />
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ArrowForwardIosIcon className="rotate-[-90deg]" />
                                </div>
                                <h2 className="text-2xl font-bold text-text-primary mb-4">Check Your Email</h2>
                                <p className="text-text-secondary mb-8">
                                    We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                                </p>
                                <Button
                                    text="Back to Login"
                                    onClick={() => navigate("/login")}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                />
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-border text-center text-sm text-text-secondary flex items-center justify-center gap-2">
                            <a
                                onClick={() => navigate("/login")}
                                className="text-accent font-bold hover:underline cursor-pointer flex items-center gap-1"
                            >
                                <ArrowBackIosNewIcon sx={{ fontSize: 12 }} />
                                Back to Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
