import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import { useState } from "react";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { auth, ApiError } from "../services/api";
import { toast } from "react-toastify";

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const email = (form.elements[0] as HTMLInputElement).value;
    const password = (form.elements[1] as HTMLInputElement).value;
    const confirmPassword = (form.elements[2] as HTMLInputElement).value;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      await auth.register({ email, password });
      // Show success message or navigate to login
      toast.success("Registration successful! Please check your email.");
      navigate("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An error occurred during registration.");
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
            Let's Code the Future Together
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-8">
            Join thousands of developers. Analyze your code, improve it,
            and create a professional portfolio.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 glass p-4 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">1</div>
              <div>
                <h3 className="font-bold text-text-primary">Create Free Account</h3>
                <p className="text-sm text-text-secondary">No credit card required, start now.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 glass p-4 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">2</div>
              <div>
                <h3 className="font-bold text-text-primary">Upload Your Code</h3>
                <p className="text-sm text-text-secondary">Connect your repo or paste your code.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 glass p-4 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold">3</div>
              <div>
                <h3 className="font-bold text-text-primary">Get Analysis</h3>
                <p className="text-sm text-text-secondary">Detailed report and improvement suggestions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 z-10 order-1">
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass-card p-8 md:p-10 border border-glass-border">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-text-primary mb-2">
                Create Account
              </h2>
              <p className="text-text-secondary">
                Register quickly and start analyzing
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary/50 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary/50 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  text="Sign Up"
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  icon={<ArrowForwardIosIcon fontSize="small" />}
                />
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center text-sm text-text-secondary flex items-center justify-center gap-2">
              Already have an account?
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
