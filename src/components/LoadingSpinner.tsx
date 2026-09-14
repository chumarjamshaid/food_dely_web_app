import { LoaderCircle } from "lucide-react";

export default function LoadingSpinner({
  label = "Loading…",
  className = "",
  fullScreen = false,
}: {
  label?: string;
  className?: string;
  fullScreen?: boolean;
}) {
  const content = (
    <div role="status" aria-live="polite" className={`flex items-center justify-center gap-3 text-sm font-semibold text-stone-600 ${className}`}>
      <LoaderCircle size={22} className="shrink-0 animate-spin text-[#c83b2b]" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );

  return fullScreen
    ? <main className="grid min-h-screen place-items-center bg-[#f7f3ed]">{content}</main>
    : content;
}
