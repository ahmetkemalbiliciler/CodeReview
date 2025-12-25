import type { ReactNode } from "react";

interface WrapperProps {
    children: ReactNode;
    className?: string;
}

export default function Wrapper({ children, className = "" }: WrapperProps) {
    return (
        <div className={`w-full max-w-7xl mx-auto px-4 md:px-6 ${className}`}>
            {children}
        </div>
    );
}
