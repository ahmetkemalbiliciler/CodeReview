import CodeEditor from "../components/CodeEditor";

export default function Home() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center px-4 py-8 md:py-12 lg:px-40 bg-bg-primary">
      <CodeEditor />

      <footer className="mt-20 w-full border-t border-border/30 py-8 text-center">
        <div className="flex flex-col items-center gap-4 px-4">
          <div className="flex gap-6 text-sm text-text-secondary font-medium">
            <a className="hover:text-accent transition-colors cursor-pointer">Documentation</a>
            <a className="hover:text-accent transition-colors cursor-pointer">API Reference</a>
            <a className="hover:text-accent transition-colors cursor-pointer">Pricing</a>
            <a className="hover:text-accent transition-colors cursor-pointer">Support</a>
          </div>
          <p className="text-xs text-border">
            © 2025 KodumunHatası AI Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
