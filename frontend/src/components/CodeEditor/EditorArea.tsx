import { useRef } from "react";

interface EditorAreaProps {
  code: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
}

export default function EditorArea({ code, onChange, readOnly }: EditorAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from(
    { length: Math.max(lineCount, 15) },
    (_, i) => i + 1
  );

  return (
    <div className="relative flex w-full min-h-[400px] md:min-h-[500px]">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="hidden sm:flex flex-col w-12 bg-bg-tertiary/20 border-r border-border/30 text-right pr-3 pt-[18px] font-mono text-sm leading-relaxed text-text-secondary select-none overflow-hidden"
      >
        {lineNumbers.map((num) => (
          <span key={num}>{num}</span>
        ))}
      </div>
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={code}
        readOnly={readOnly}
        onScroll={handleScroll}
        onChange={(e) => onChange?.(e.target.value)}
        className="flex-1 w-full h-full bg-transparent text-text-primary font-mono text-sm leading-relaxed p-[18px] focus:outline-none resize-none placeholder:text-text-secondary/40 border-none focus:ring-0 overflow-y-auto"
        placeholder={`// Paste your code here to begin analysis...

function optimizeAlgorithm(data) {
  // TODO: Implement sorting logic
  return data.filter(item => item.isValid);
}`}
        spellCheck="false"
      ></textarea>
    </div>
  );
}

