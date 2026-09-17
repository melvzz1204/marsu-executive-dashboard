import { useEffect } from "react";

const VARIANTS = {
  success: {
    title: "Upload successful",
    icon: "✓",
    barColor: "bg-emerald-500",
    iconWrap: "bg-emerald-500 text-white shadow-md shadow-emerald-500/30",
    border: "border-emerald-200",
    titleColor: "text-emerald-950",
    textColor: "text-emerald-900/80",
    chip: "bg-emerald-100/90 text-emerald-950",
  },
  error: {
    title: "Upload failed",
    icon: "!",
    barColor: "bg-rose-500",
    iconWrap: "bg-rose-500 text-white shadow-md shadow-rose-500/30",
    border: "border-rose-200",
    titleColor: "text-rose-950",
    textColor: "text-rose-900/80",
    chip: "bg-rose-100/90 text-rose-950",
  },
  info: {
    title: "Notice",
    icon: "i",
    barColor: "bg-sky-500",
    iconWrap: "bg-sky-500 text-white shadow-md shadow-sky-500/30",
    border: "border-sky-200",
    titleColor: "text-sky-950",
    textColor: "text-sky-900/80",
    chip: "bg-sky-100/90 text-sky-950",
  },
};

const humanizeKey = (key) =>
  String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

/**
 * Reusable floating toast notification.
 *
 * @param {{ toast: { type?: "success"|"error"|"info", title?: string, text: string, stats?: object } | null,
 *            onClose: () => void, duration?: number }} props
 *
 * Renders nothing when `toast` is null. Auto-dismisses after `duration`
 * (success: 5s, error: 8s by default). Drop it once per page:
 *
 *   <Toast toast={statusMessage} onClose={() => setStatusMessage(null)} />
 */
export default function Toast({ toast, onClose, duration }) {
  const autoDismissMs =
    duration ?? (toast?.type === "error" ? 8000 : 5000);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(onClose, autoDismissMs);
    return () => window.clearTimeout(id);
  }, [toast, onClose, autoDismissMs]);

  if (!toast) return null;

  const variant = VARIANTS[toast.type] || VARIANTS.info;
  const statsEntries = toast.stats
    ? Object.entries(toast.stats).filter(
        ([, value]) => value !== undefined && value !== null,
      )
    : [];

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-enter fixed bottom-6 right-6 z-[200] w-[min(24rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${variant.iconWrap}`}
          >
            {variant.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-extrabold tracking-tight ${variant.titleColor}`}>
              {toast.title || variant.title}
            </p>
            <p className={`mt-0.5 text-xs font-medium leading-relaxed ${variant.textColor}`}>
              {toast.text}
            </p>
            {statsEntries.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {statsEntries.map(([key, value]) => (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${variant.chip}`}
                  >
                    {humanizeKey(key)}: <strong className="font-extrabold">{String(value)}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss notification"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="h-1 w-full bg-slate-100">
        <div
          key={toast.text}
          className={`toast-progress h-full ${variant.barColor}`}
          style={{ animationDuration: `${autoDismissMs}ms` }}
        />
      </div>
    </div>
  );
}
