export default function Footer({ isDarkMode = false }) {
  return (
    <footer
      className={`mt-auto flex flex-col justify-between gap-2 border-t px-4 py-5 text-xs font-medium font-oswald transition-colors duration-300 sm:flex-row sm:px-6 lg:px-12 lg:py-6 ${
        isDarkMode
          ? "bg-slate-800/50 border-slate-800 text-slate-500"
          : "bg-white border-slate-200 text-slate-400"
      }`}
    >
      <p>© 2026 Marinduque State University. All rights reserved.</p>
      <p
        className={`tracking-wide font-bold uppercase ${isDarkMode ? "text-rose-400" : "text-[#600018]"}`}
      >
        Confidential / Governance Intelligence Matrix
      </p>
    </footer>
  );
}
