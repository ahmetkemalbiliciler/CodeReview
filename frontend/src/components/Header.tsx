import { useNavigate, Outlet, useLocation } from "react-router-dom";
import Button from "./common/Button";
import { useState, useEffect } from "react";
import { IconButton } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import HistoryIcon from "@mui/icons-material/History";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import Wrapper from "./common/Wrapper";
import Logo from "./Logo";
import { auth } from "../services/api";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      // Fetch user details
      auth.me()
        .then((data) => {
          if (data && data.email) {
            setUserEmail(data.email);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch user info", err);
          // If auth fails, maybe token is invalid?
          // optional: handleLogout();
        });
    }
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserEmail(null);
    navigate("/");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b-0 border-glass-border">
        <Wrapper>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <Logo size={32} className="text-accent group-hover:rotate-12 transition-transform duration-300" />
              <div className="flex items-baseline">
                <h2 className="text-text-primary text-xl font-bold tracking-tight">
                  Kodumun
                </h2>
                <h3 className="text-accent text-sm font-bold ml-0.5">
                  &lt;Hatası&gt;
                </h3>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <Button
                    text="History"
                    variant="ghost"
                    onClick={() => navigate("/history")}
                    icon={<HistoryIcon />}
                  />
                  <div className="h-6 w-px bg-border mx-2"></div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden lg:block">
                      <p className="text-xs text-text-secondary">Logged in as</p>
                      <p className="text-sm font-medium text-text-primary">{userEmail || "User"}</p>
                    </div>
                    <IconButton
                      className="bg-bg-tertiary hover:bg-accent hover:text-white transition-colors"
                      onClick={handleLogout}
                    >
                      <PersonIcon />
                    </IconButton>
                  </div>
                </>
              ) : (
                <>
                  <Button text="Giriş Yap" variant="ghost" onClick={() => navigate("/login")} />
                  <Button
                    text="Kayıt Ol"
                    variant="primary"
                    onClick={() => navigate("/register")}
                    className="shadow-accent/25"
                  />
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <IconButton onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-text-primary">
                {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            </div>
          </div>
        </Wrapper>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden absolute top-16 left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl border-b border-border shadow-2xl transition-all duration-300 origin-top overflow-hidden ${isMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="p-4 space-y-4 flex flex-col">
            {isLoggedIn ? (
              <>
                <Button
                  text="Review History"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/history")}
                  icon={<HistoryIcon />}
                />
                <Button
                  text="Logout"
                  variant="secondary"
                  className="w-full justify-start text-red-400 hover:text-red-500"
                  onClick={handleLogout}
                  icon={<PersonIcon />}
                />
              </>
            ) : (
              <>
                <Button
                  text="Giriş Yap"
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate("/login")}
                />
                <Button
                  text="Kayıt Ol"
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate("/register")}
                />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 min-h-screen bg-bg-primary">
        <Outlet />
      </main>
    </>
  );
}
