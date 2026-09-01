import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AchievementPosts from "../components/AchievementPosts";
import marsuLogo from "../assets/marsu-logo.png";

const navigation = [
  {
    id: "compose",
    label: "Create story",
    description: "Draft a new achievement",
    icon: "✦",
  },
  {
    id: "submissions",
    label: "My submissions",
    description: "Track review and publication",
    icon: "▤",
  },
];

export default function DeanAchievements() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("compose");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (!localStorage.getItem("token") || user.role !== "dean")
      navigate("/", { replace: true });
  }, [navigate, user.role]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const selectView = (view) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const initials = (user.name || "Dean")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <div className="oswald-brand min-h-screen bg-[#f6f7f9] text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={marsuLogo}
              alt="MarSU logo"
              className="h-10 w-10 object-contain"
            />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9a791c]">
                Dean workspace
              </p>
              <p className="truncate text-sm font-black text-[#600018]">
                Achievement Publisher
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-xl text-[#600018]"
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="space-y-2 border-t border-slate-100 p-4 shadow-lg">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectView(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ${activeView === item.id ? "bg-[#600018] text-white" : "bg-slate-50 text-slate-700"}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-black">{item.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl border border-rose-200 p-3 text-left text-sm font-black text-rose-700"
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col overflow-hidden bg-[#500014] text-white shadow-2xl lg:flex">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white p-1 shadow-lg">
              <img
                src={marsuLogo}
                alt="MarSU logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                Marinduque State University
              </p>
              <h1 className="mt-1 text-base font-black uppercase leading-tight">
                Dean Publishing
                <br />
                Workspace
              </h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <p className="px-3 pb-2 pt-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
            Achievement tools
          </p>
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectView(item.id)}
              className={`group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${activeView === item.id ? "bg-white text-[#600018] shadow-xl" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg ${activeView === item.id ? "bg-[#600018] text-[#D4AF37]" : "bg-white/10"}`}
              >
                {item.icon}
              </span>
              <span>
                <span className="block text-sm font-black">{item.label}</span>
                <span
                  className={`mt-0.5 block text-[10px] ${activeView === item.id ? "text-slate-500" : "text-white/40"}`}
                >
                  {item.description}
                </span>
              </span>
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#D4AF37] text-sm font-black text-[#500014]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-black">
                {user.name || "Dean"}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-white/45">
                Dean account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white/70 transition hover:border-rose-300/50 hover:bg-rose-500/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#600018] via-[#740027] to-[#3d0010] p-6 text-white shadow-xl sm:p-9">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[40px] border-white/5" />
            <div className="absolute -bottom-24 right-28 h-52 w-52 rounded-full bg-[#D4AF37]/10 blur-2xl" />
            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#f1d36b]">
                  <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                  Institutional storytelling
                </div>
                <h2 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                  {activeView === "compose"
                    ? "Share your college’s achievements."
                    : "Follow every story from draft to publication."}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                  {activeView === "compose"
                    ? "Create a clear, visual, publication-ready story for review by the Information Unit."
                    : "Review the status, feedback, and published result of your achievement submissions."}
                </p>
              </div>
              {activeView === "submissions" && (
                <button
                  type="button"
                  onClick={() => selectView("compose")}
                  className="shrink-0 rounded-xl bg-[#D4AF37] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#500014] shadow-lg transition hover:bg-[#e6c552]"
                >
                  + Create new story
                </button>
              )}
            </div>
          </section>

          {activeView === "compose" && (
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Write the story", "Add accurate, concise details"],
                ["2", "Add media", "Upload images and evidence"],
                ["3", "Submit for review", "Information Unit verifies it"],
              ].map(([number, title, text]) => (
                <div
                  key={number}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#600018] text-sm font-black text-[#D4AF37]">
                    {number}
                  </span>
                  <div>
                    <p className="text-xs font-black text-slate-900">{title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <AchievementPosts mode="dean" deanView={activeView} />
        </main>
        <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Marinduque State University · Achievement Publishing Workflow
        </footer>
      </div>
    </div>
  );
}
