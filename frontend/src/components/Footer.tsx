import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/30 bg-bg-secondary/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div 
              className="flex items-center gap-2 cursor-pointer group mb-4"
              onClick={() => navigate("/")}
            >
              <Logo size={28} className="text-accent group-hover:rotate-12 transition-transform duration-300" />
              <div className="flex items-baseline">
                <h2 className="text-text-primary text-lg font-bold tracking-tight">
                  Core
                </h2>
                <h3 className="text-accent text-sm font-bold ml-0.5">
                  &lt;Error&gt;
                </h3>
              </div>
            </div>
            <p className="text-text-secondary text-sm max-w-md leading-relaxed">
              Improve your projects with AI-powered code analysis. 
              Detect bugs in seconds and enhance your code quality.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-text-primary font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  onClick={() => navigate("/")} 
                  className="text-text-secondary text-sm hover:text-accent transition-colors cursor-pointer"
                >
                  Code Analysis
                </a>
              </li>
              <li>
                <a 
                  onClick={() => navigate("/dashboard")} 
                  className="text-text-secondary text-sm hover:text-accent transition-colors cursor-pointer"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a 
                  onClick={() => navigate("/history")} 
                  className="text-text-secondary text-sm hover:text-accent transition-colors cursor-pointer"
                >
                  History
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-text-primary font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#" 
                  className="text-text-secondary text-sm hover:text-accent transition-colors cursor-pointer"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-text-secondary text-sm hover:text-accent transition-colors cursor-pointer"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-text-secondary text-sm hover:text-accent transition-colors cursor-pointer"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/30 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-secondary">
            © {currentYear} CoreError AI Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-text-secondary">
            <a href="#" className="hover:text-accent transition-colors cursor-pointer">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-accent transition-colors cursor-pointer">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
