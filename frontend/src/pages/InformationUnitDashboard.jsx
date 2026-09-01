import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AchievementPosts from "../components/AchievementPosts";
import api from "../api/axios";
import marsuLogo from "../assets/marsu-logo.png";

const navigation = [
  { id: "overview", label: "Overview", description: "Publishing activity" },
  { id: "pending", label: "Review Queue", description: "Pending submissions" },
  { id: "approved", label: "Published", description: "Approved stories" },
  { id: "rejected", label: "Returned", description: "Revision requests" },
];

const statusStyle = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

function MetricCard({ label, value, detail, tone }) {
  const tones = {
    maroon: "bg-[#600018] text-white",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  };
  return (
    <article
      className={`rounded-2xl border border-transparent p-5 shadow-sm ${tones[tone]}`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.18em] ${tone === "maroon" ? "text-[#D4AF37]" : "opacity-60"}`}
      >
        {label}
      </p>
      <p className="mt-3 text-4xl font-black">{value}</p>
      <p
        className={`mt-2 text-xs font-semibold ${tone === "maroon" ? "text-white/65" : "opacity-65"}`}
      >
        {detail}
      </p>
    </article>
  );
}

export default function InformationUnitDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/achievement-posts/review");
      setPosts(data.posts || []);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load publishing activity.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token") || user.role !== "information_unit") {
      navigate("/", { replace: true });
      return undefined;
    }
    const timer = window.setTimeout(loadOverview, 0);
    return () => window.clearTimeout(timer);
  }, [loadOverview, navigate, user.role]);

  const counts = useMemo(
    () => ({
      all: posts.length,
      pending: posts.filter((post) => post.status === "pending").length,
      approved: posts.filter((post) => post.status === "approved").length,
      rejected: posts.filter((post) => post.status === "rejected").length,
    }),
    [posts],
  );
  const recentPosts = posts.slice(0, 6);
  const initials = (user.name || "Information Unit")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const currentLabel =
    navigation.find((item) => item.id === activeView)?.label || "Overview";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const selectView = (view) => {
    setActiveView(view);
    setMobileNavOpen(false);
  };

  return (
    <div className="oswald-brand flex h-dvh overflow-hidden bg-[#f4f6f8] text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(19rem,calc(100vw-3rem))] flex-col bg-[#600018] text-white shadow-2xl transition-transform lg:static lg:w-72 lg:translate-x-0 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <img
              src={marsuLogo}
              alt="MarSU logo"
              className="h-14 w-14 object-contain"
            />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                Marinduque State University
              </p>
              <h1 className="mt-1 text-lg font-black uppercase leading-tight">
                Information Unit
              </h1>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-[#D4AF37]/20 bg-white/[0.06] p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">
              Editorial command center
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Review, govern, and publish institutional achievements.
            </p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          <p className="px-3 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/35">
            Publishing workspace
          </p>
          {navigation.map((item) => {
            const active = activeView === item.id;
            const badge = item.id === "pending" ? counts.pending : null;
            return (
              <button
                key={item.id}
                onClick={() => selectView(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${active ? "bg-white text-[#600018] shadow-lg" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-[#600018]/10" : "bg-white/[0.06]"}`}
                >
                  {item.id === "overview"
                    ? "▦"
                    : item.id === "pending"
                      ? "◷"
                      : item.id === "approved"
                        ? "✓"
                        : "↩"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black uppercase tracking-wide">
                    {item.label}
                  </span>
                  <span
                    className={`mt-0.5 block text-[10px] ${active ? "text-slate-500" : "text-white/40"}`}
                  >
                    {item.description}
                  </span>
                </span>
                {badge > 0 && (
                  <span className="rounded-full bg-[#D4AF37] px-2 py-1 text-[10px] font-black text-[#600018]">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 bg-[#510014] p-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-xs font-black text-[#600018]">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-black">
                {user.name || "Information Unit"}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">
                Content administrator
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase tracking-wider text-white/70 transition hover:bg-rose-500/20 hover:text-white"
          >
            Secure logout
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#600018] lg:hidden"
                aria-label="Open navigation"
              >
                ☰
              </button>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#600018]">
                  Content governance
                </p>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
                  {currentLabel}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              System online
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
              {error}
            </div>
          )}
          {activeView === "overview" ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Total submissions"
                  value={loading ? "—" : counts.all}
                  detail="All editorial records"
                  tone="maroon"
                />
                <MetricCard
                  label="Awaiting review"
                  value={loading ? "—" : counts.pending}
                  detail="Requires editorial action"
                  tone="amber"
                />
                <MetricCard
                  label="Published"
                  value={loading ? "—" : counts.approved}
                  detail="Live institutional stories"
                  tone="green"
                />
                <MetricCard
                  label="Returned"
                  value={loading ? "—" : counts.rejected}
                  detail="Sent back with guidance"
                  tone="rose"
                />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                  <div>
                    <h3 className="text-lg font-black uppercase text-slate-950">
                      Recent editorial activity
                    </h3>
                    <p className="text-xs text-slate-500">
                      Latest dean submissions and review outcomes
                    </p>
                  </div>
                  <button
                    onClick={() => selectView("pending")}
                    className="text-xs font-black uppercase text-[#600018]"
                  >
                    Open review queue →
                  </button>
                </div>
                {loading ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    Loading publishing activity...
                  </div>
                ) : recentPosts.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    No submissions have been received.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentPosts.map((post) => (
                      <div
                        key={post._id}
                        className="flex flex-col gap-3 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-900">
                            {post.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {post.author?.name || "Dean"} · {post.category} ·{" "}
                            {new Date(post.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${statusStyle[post.status]}`}
                        >
                          {post.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <AchievementPosts
              mode="review"
              statusFilter={activeView}
              onStatusChange={loadOverview}
            />
          )}
        </div>
      </main>
    </div>
  );
}
