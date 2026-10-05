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

const categories = [
  "Academic Excellence",
  "Research and Innovation",
  "Awards and Recognition",
  "Community Engagement",
  "Student Achievement",
  "Faculty Achievement",
  "Partnerships",
  "Sustainability",
  "Other",
];

const sdgNames = [
  "No Poverty",
  "Zero Hunger",
  "Good Health",
  "Quality Education",
  "Gender Equality",
  "Clean Water",
  "Clean Energy",
  "Decent Work",
  "Industry & Innovation",
  "Reduced Inequalities",
  "Sustainable Cities",
  "Responsible Consumption",
  "Climate Action",
  "Life Below Water",
  "Life on Land",
  "Peace & Justice",
  "Partnerships for the Goals",
];

const emptyEditForm = {
  title: "",
  subtitle: "",
  body: "",
  category: "Awards and Recognition",
  eventDate: new Date().toISOString().slice(0, 10),
  location: "",
  sourceUrl: "",
  tags: "",
  sdgs: [],
};

function FilePreviewGrid({ files, onRemove }) {
  const urls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  useEffect(
    () => () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    },
    [urls],
  );
  if (files.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${file.size}-${index}`}
          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950"
        >
          <img
            src={urls[index]}
            alt={`Selected upload ${index + 1}`}
            className="h-24 w-full object-contain"
          />
          <span className="block truncate bg-white px-1.5 py-1 text-[10px] font-bold text-slate-500">
            {file.name}
          </span>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove image ${index + 1}`}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950/70 text-sm text-white transition hover:bg-rose-600"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

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
  const [actionNotice, setActionNotice] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editImages, setEditImages] = useState([]);
  const [editAttachment, setEditAttachment] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [confirmDeletePost, setConfirmDeletePost] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
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

  const startEdit = (post) => {
    setEditingPost(post);
    setEditForm({
      title: post.title || "",
      subtitle: post.subtitle || "",
      body: post.body || "",
      category: post.category || "Awards and Recognition",
      eventDate: post.eventDate
        ? new Date(post.eventDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      location: post.location || "",
      sourceUrl: post.sourceUrl || "",
      tags: (post.tags || []).join(", "),
      sdgs: [...(post.sdgs || [])],
    });
    setEditImages([]);
    setEditAttachment(null);
    setRemoveAttachment(false);
    setActionNotice(null);
  };

  const closeEdit = () => {
    setEditingPost(null);
    setEditImages([]);
    setEditAttachment(null);
    setRemoveAttachment(false);
  };

  const toggleEditSdg = (number) =>
    setEditForm((current) => ({
      ...current,
      sdgs: current.sdgs.includes(number)
        ? current.sdgs.filter((item) => item !== number)
        : [...current.sdgs, number],
    }));

  const submitEdit = async (event) => {
    event?.preventDefault();
    if (!editingPost) return;
    if (editImages.length > 10)
      return setActionNotice({
        type: "error",
        text: "Choose no more than 10 replacement images.",
      });
    const newFiles = [
      ...editImages,
      ...(editAttachment ? [editAttachment] : []),
    ];
    const totalUploadSize = newFiles.reduce(
      (total, file) => total + file.size,
      0,
    );
    if (totalUploadSize > 15 * 1024 * 1024)
      return setActionNotice({
        type: "error",
        text: "Replacement files must not exceed 15 MB in total.",
      });
    const payload = new FormData();
    Object.entries(editForm).forEach(([key, value]) =>
      payload.append(key, key === "sdgs" ? JSON.stringify(value) : value),
    );
    editImages.forEach((image) => payload.append("images", image));
    if (editAttachment) payload.append("attachment", editAttachment);
    if (removeAttachment) payload.append("removeAttachment", "true");
    setEditBusy(true);
    setActionNotice(null);
    try {
      const { data } = await api.patch(
        `/achievement-posts/${editingPost._id}`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setActionNotice({ type: "success", text: data.message });
      closeEdit();
      await loadOverview();
    } catch (requestError) {
      setActionNotice({
        type: "error",
        text:
          requestError.response?.data?.message || "Unable to update the post.",
      });
    } finally {
      setEditBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmDeletePost) return;
    setDeletingId(confirmDeletePost._id);
    setActionNotice(null);
    try {
      const { data } = await api.delete(
        `/achievement-posts/${confirmDeletePost._id}`,
      );
      setActionNotice({ type: "success", text: data.message });
      setConfirmDeletePost(null);
      await loadOverview();
    } catch (requestError) {
      setActionNotice({
        type: "error",
        text:
          requestError.response?.data?.message || "Unable to delete the post.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-[#600018] focus:ring-4 focus:ring-[#600018]/5";

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
          {actionNotice && (
            <div
              className={`rounded-xl border p-4 text-sm font-semibold ${actionNotice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}
            >
              {actionNotice.text}
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
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${statusStyle[post.status]}`}
                          >
                            {post.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEdit(post)}
                            disabled={deletingId === post._id}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#600018] transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            ✎ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePost(post)}
                            disabled={deletingId === post._id}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                          >
                            {deletingId === post._id
                              ? "Deleting..."
                              : "🗑 Delete"}
                          </button>
                        </div>
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

      {editingPost && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit achievement post"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={submitEdit}
            className="max-h-[92vh] w-full max-w-3xl space-y-5 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black uppercase text-slate-950">
                  Edit achievement
                </h3>
                <p className="text-xs text-slate-500">
                  {editingPost.status === "approved"
                    ? "Editing a published story updates it instantly."
                    : `Current status: ${editingPost.status}`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                aria-label="Close edit dialog"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
                Title *
                <input
                  required
                  minLength="5"
                  maxLength="160"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
                Subtitle *
                <input
                  required
                  minLength="5"
                  maxLength="240"
                  value={editForm.subtitle}
                  onChange={(e) =>
                    setEditForm({ ...editForm, subtitle: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                Category *
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                Achievement date *
                <input
                  required
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={editForm.eventDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, eventDate: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                Location
                <input
                  maxLength="180"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                Source link
                <input
                  type="url"
                  maxLength="500"
                  value={editForm.sourceUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, sourceUrl: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                  placeholder="https://..."
                />
              </label>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
                Story body *
                <textarea
                  required
                  minLength="30"
                  maxLength="10000"
                  rows="6"
                  value={editForm.body}
                  onChange={(e) =>
                    setEditForm({ ...editForm, body: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
                Topic tags
                <input
                  value={editForm.tags}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tags: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                  placeholder="research, innovation, student award (maximum 10)"
                />
              </label>
              <div className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
                <label>
                  Replace images (optional; 1–10 JPEG, PNG, or WebP; leave empty
                  to keep current {editingPost.images?.length || 0} — full photo
                  is kept)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) =>
                      setEditImages(Array.from(e.target.files).slice(0, 10))
                    }
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
                {editImages.length > 0 && (
                  <span className="mt-2 block normal-case text-slate-500">
                    {editImages.length} replacement image
                    {editImages.length === 1 ? "" : "s"} selected — shown below
                    uncropped
                  </span>
                )}
                <FilePreviewGrid
                  files={editImages}
                  onRemove={(index) =>
                    setEditImages((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                />
              </div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
                Supporting file
                {editingPost.attachment && (
                  <p className="mt-2 normal-case text-slate-500">
                    Current: {editingPost.attachment.filename}
                  </p>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) =>
                    setEditAttachment(e.target.files?.[0] || null)
                  }
                  className={`mt-2 ${inputClass}`}
                />
                {editingPost.attachment && !editAttachment && (
                  <label className="mt-2 flex cursor-pointer items-center gap-2 normal-case text-rose-700">
                    <input
                      type="checkbox"
                      checked={removeAttachment}
                      onChange={(e) => setRemoveAttachment(e.target.checked)}
                      className="accent-rose-600"
                    />
                    Remove current attachment
                  </label>
                )}
              </div>
            </div>
            <fieldset>
              <legend className="text-xs font-black uppercase tracking-wider text-slate-600">
                Related UN Sustainable Development Goals
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sdgNames.map((name, index) => (
                  <label
                    key={name}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs font-bold ${editForm.sdgs.includes(index + 1) ? "border-[#600018] bg-[#600018] text-white" : "border-slate-200 bg-white text-slate-600"}`}
                  >
                    <input
                      type="checkbox"
                      checked={editForm.sdgs.includes(index + 1)}
                      onChange={() => toggleEditSdg(index + 1)}
                      className="accent-[#D4AF37]"
                    />
                    SDG {index + 1}: {name}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closeEdit}
                disabled={editBusy}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editBusy}
                className="rounded-xl bg-[#600018] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow disabled:opacity-50"
              >
                {editBusy ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDeletePost && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete achievement post"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black uppercase text-slate-950">
              Delete achievement?
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              This will permanently remove{" "}
              <strong className="text-slate-900">
                “{confirmDeletePost.title}”
              </strong>{" "}
              from all dashboards. This action cannot be undone.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeletePost(null)}
                disabled={deletingId !== null}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow disabled:opacity-50"
              >
                {deletingId ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
