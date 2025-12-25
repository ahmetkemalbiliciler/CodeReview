import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import { useState } from "react";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { auth, ApiError } from "../services/api";

export default function Login() {
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

    try {
      const data = await auth.login({ email, password });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user)); // Optional: store user info
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Giriş yapılırken bir hata oluştu.");
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

      {/* Left Side - Hero Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative z-10">
        <div className="max-w-xl animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-6">
            Kodunuzun Potansiyelini Keşfedin
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-8">
            Yapay zeka destekli kod inceleme platformumuz ile hataları saniyeler
            içinde bulun, temiz kod yazın ve projelerinizi bir üst seviyeye taşıyın.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-4 rounded-xl">
              <h3 className="text-xl font-bold text-accent mb-2">Hızlı</h3>
              <p className="text-sm text-text-secondary">
                Saniyeler içinde detaylı analiz sonuçlarına ulaşın.
              </p>
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="text-xl font-bold text-accent mb-2">Akıllı</h3>
              <p className="text-sm text-text-secondary">
                Modern best-practice'lere göre kodunuzu optimize edin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass-card p-8 md:p-10 border border-glass-border">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-text-primary mb-2">
                Hoş Geldiniz
              </h2>
              <p className="text-text-secondary">
                Devam etmek için hesabınıza giriş yapın
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary/50 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-gray-600"
                  placeholder="ornek@mail.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">
                  Parola
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary/50 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <label className="flex items-center text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                  <input
                    type="checkbox"
                    className="mr-2 rounded border-border bg-bg-secondary cursor-pointer accent-accent"
                  />
                  Beni Hatırla
                </label>
                <a
                  onClick={() => navigate("/forgot-password")}
                  className="text-accent hover:text-accent/80 transition-colors cursor-pointer font-medium"
                >
                  Şifremi Unuttum?
                </a>
              </div>

              <Button
                text="Giriş Yap"
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4"
                isLoading={isLoading}
                icon={<ArrowForwardIosIcon fontSize="small" />}
              />
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center text-sm text-text-secondary flex items-center justify-center gap-2">
              Hesabınız yok mu?
              <a
                onClick={() => navigate("/register")}
                className="text-accent font-bold hover:underline cursor-pointer"
              >
                Hemen Kaydolun
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
