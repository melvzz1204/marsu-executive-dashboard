import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

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

const emptyForm = {
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

const normalizeAssetUrl = (url = "") =>
  url.startsWith("/api/v1/") ? url.replace(/^\/api\/v1/, "") : url;

function ProtectedImage({ image, className = "" }) {
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);
  const assetUrl = normalizeAssetUrl(image.url);
  useEffect(() => {
    let objectUrl;
    let active = true;
    api
      .get(assetUrl, { responseType: "blob" })
      .then(({ data }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(data);
        setSource(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetUrl]);
  return source ? (
    <img
      src={source}
      alt={image.altText || "Achievement image"}
      className={className}
    />
  ) : (
    <div
      className={`${className} flex items-center justify-center bg-slate-100 text-xs font-bold text-slate-400`}
    >
      {failed ? "Image unavailable" : "Loading image..."}
    </div>
  );
}

function ImageGallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const visibleImages = images.slice(0, 4);
  const count = images.length;
  const tileClass =
    count === 1
      ? "col-span-2 row-span-2"
      : count === 2
        ? "row-span-2"
        : count === 3
          ? "first:row-span-2"
          : "";

  const close = () => setActiveIndex(null);
  const previous = () => setActiveIndex((index) => (index - 1 + count) % count);
  const next = () => setActiveIndex((index) => (index + 1) % count);

  return (
    <>
      <div className="grid h-72 grid-cols-2 grid-rows-2 gap-1 overflow-hidden bg-slate-100 sm:h-[30rem]">
        {visibleImages.map((image, index) => (
          <button
            key={image.id || index}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Open image ${index + 1} of ${count}`}
            className={`group relative min-h-0 overflow-hidden bg-slate-100 ${tileClass}`}
          >
            <ProtectedImage
              image={image}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
            {index === 3 && count > 4 && (
              <span className="absolute inset-0 grid place-items-center bg-slate-950/60 text-3xl font-black text-white sm:text-5xl">
                +{count - 4}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Achievement image gallery"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close gallery"
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20"
          >
            ×
          </button>
          {count > 1 && (
            <button
              type="button"
              onClick={previous}
              aria-label="Previous image"
              className="absolute left-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:left-8"
            >
              ‹
            </button>
          )}
          <div className="flex h-full w-full max-w-6xl flex-col items-center justify-center gap-4">
            <ProtectedImage
              image={images[activeIndex]}
              className="max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
            <p className="text-xs font-black uppercase tracking-widest text-white/70">
              {activeIndex + 1} of {count}
            </p>
          </div>
          {count > 1 && (
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:right-8"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}

function AttachmentLink({ attachment }) {
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      const { data } = await api.get(normalizeAssetUrl(attachment.url), {
        responseType: "blob",
      });
      const objectUrl = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={download}
      disabled={downloading}
      className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 font-bold text-[#600018] transition hover:bg-slate-200 disabled:opacity-50"
    >
      <span aria-hidden="true">📎</span>
      {downloading ? "Downloading..." : attachment.filename}
    </button>
  );
}

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
};

function PostCard({ post, canReview, onReview, busy }) {
  const [feedback, setFeedback] = useState(post.review?.feedback || "");
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl">
      {post.images?.length > 0 && <ImageGallery images={post.images} />}
      <div className="space-y-5 p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#600018]">
            {post.category}
          </span>
          <StatusBadge status={post.status} />
        </div>
        <div>
          <h3 className="text-2xl font-black leading-tight text-slate-950 sm:text-4xl">
            {post.title}
          </h3>
          {post.subtitle && (
            <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-500">
              {post.subtitle}
            </p>
          )}
        </div>
        <p className="whitespace-pre-wrap text-base leading-8 text-slate-700">
          {post.body}
        </p>
        <div className="flex flex-wrap gap-2">
          {post.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
            >
              #{tag}
            </span>
          ))}
          {post.sdgs?.map((sdg) => (
            <span
              key={sdg}
              title={sdgNames[sdg - 1]}
              className="rounded-lg bg-[#600018] px-2.5 py-1 text-xs font-bold text-white"
            >
              SDG {sdg}
            </span>
          ))}
        </div>
        <dl className="grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:grid-cols-2">
          <div>
            <dt className="font-black uppercase tracking-wider">
              Achievement date
            </dt>
            <dd>{new Date(post.eventDate).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="font-black uppercase tracking-wider">
              Submitted by
            </dt>
            <dd>{post.author?.name || "Dean"}</dd>
          </div>
          {post.location && (
            <div>
              <dt className="font-black uppercase tracking-wider">Location</dt>
              <dd>{post.location}</dd>
            </div>
          )}
          {post.sourceUrl && (
            <div>
              <dt className="font-black uppercase tracking-wider">Source</dt>
              <dd>
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#600018] underline"
                >
                  View supporting source
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="font-black uppercase tracking-wider">Submitted</dt>
            <dd>{new Date(post.submittedAt).toLocaleString()}</dd>
          </div>
          {post.attachment && (
            <div className="sm:col-span-2">
              <dt className="mb-2 font-black uppercase tracking-wider">
                Attached file
              </dt>
              <dd>
                <AttachmentLink attachment={post.attachment} />
              </dd>
            </div>
          )}
        </dl>
        {post.review?.feedback && !canReview && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <strong>Information Unit feedback:</strong> {post.review.feedback}
          </div>
        )}
        {canReview && post.status === "pending" && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
              Review notes / correction request
            </label>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows="3"
              placeholder="Required when rejecting; optional when approving."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#600018]"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <button
                disabled={busy}
                onClick={() => onReview(post._id, "rejected", feedback)}
                className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-black uppercase text-rose-700 disabled:opacity-50"
              >
                Return for revision
              </button>
              <button
                disabled={busy}
                onClick={() => onReview(post._id, "approved", feedback)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
              >
                Approve & publish
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function AchievementPosts({
  mode = "published",
  isDarkMode = false,
  statusFilter = "",
  onStatusChange,
  deanView = "all",
}) {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const endpoint =
    mode === "review"
      ? `/achievement-posts/review${
          statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ""
        }`
      : mode === "dean"
        ? "/achievement-posts/mine"
        : "/achievement-posts/published";

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(endpoint);
      setPosts(data.posts || []);
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.response?.data?.message || "Unable to load achievement posts.",
      });
    } finally {
      setLoading(false);
    }
  }, [endpoint]);
  useEffect(() => {
    const loadTimer = window.setTimeout(loadPosts, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadPosts]);

  const pendingCount = useMemo(
    () => posts.filter((post) => post.status === "pending").length,
    [posts],
  );
  const toggleSdg = (number) =>
    setForm((current) => ({
      ...current,
      sdgs: current.sdgs.includes(number)
        ? current.sdgs.filter((item) => item !== number)
        : [...current.sdgs, number],
    }));

  const submitPost = async (event) => {
    event.preventDefault();
    if (images.length < 1 || images.length > 10)
      return setNotice({
        type: "error",
        text: "Choose between 1 and 10 images.",
      });
    const oversizedFile = [...images, ...(attachment ? [attachment] : [])].find(
      (file) => file.size > 15 * 1024 * 1024,
    );
    if (oversizedFile)
      return setNotice({
        type: "error",
        text: `${oversizedFile.name} exceeds the 15 MB file limit.`,
      });
    const totalUploadSize = [
      ...images,
      ...(attachment ? [attachment] : []),
    ].reduce((total, file) => total + file.size, 0);
    if (totalUploadSize > 15 * 1024 * 1024)
      return setNotice({
        type: "error",
        text: "Images and attachment must not exceed 15 MB in total.",
      });
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) =>
      payload.append(key, key === "sdgs" ? JSON.stringify(value) : value),
    );
    [...images].forEach((image) => payload.append("images", image));
    if (attachment) payload.append("attachment", attachment);
    setBusy(true);
    setNotice(null);
    try {
      const { data } = await api.post("/achievement-posts", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNotice({ type: "success", text: data.message });
      setForm(emptyForm);
      setImages([]);
      setAttachment(null);
      event.target.reset();
      await loadPosts();
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Submission failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const reviewPost = async (id, decision, feedback) => {
    setBusy(true);
    setNotice(null);
    try {
      const { data } = await api.patch(`/achievement-posts/${id}/review`, {
        decision,
        feedback,
      });
      setNotice({ type: "success", text: data.message });
      await loadPosts();
      await onStatusChange?.();
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Review action failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-[#600018] focus:ring-4 focus:ring-[#600018]/5";
  return (
    <section
      className={`space-y-6 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}
    >
      {notice && (
        <div
          className={`rounded-xl border p-4 text-sm font-semibold ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}
        >
          {notice.text}
        </div>
      )}

      {mode === "dean" && deanView !== "submissions" && (
        <form
          onSubmit={submitPost}
          className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-7"
        >
          <div>
            <h3 className="text-lg font-black uppercase text-slate-950">
              Submit an achievement
            </h3>
            <p className="text-sm text-slate-500">
              Use accurate, publication-ready details. Fields marked required
              must be completed.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
              Title *
              <input
                required
                minLength="5"
                maxLength="160"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={`mt-2 ${inputClass}`}
                placeholder="A clear, specific achievement headline"
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
              Subtitle *
              <input
                required
                minLength="5"
                maxLength="240"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className={`mt-2 ${inputClass}`}
                placeholder="One-sentence context or impact statement"
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wider text-slate-600">
              Category *
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
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
                value={form.eventDate}
                onChange={(e) =>
                  setForm({ ...form, eventDate: e.target.value })
                }
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wider text-slate-600">
              Location
              <input
                maxLength="180"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wider text-slate-600">
              Source link
              <input
                type="url"
                maxLength="500"
                value={form.sourceUrl}
                onChange={(e) =>
                  setForm({ ...form, sourceUrl: e.target.value })
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
                rows="7"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className={`mt-2 ${inputClass}`}
                placeholder="Explain who, what, when, where, why, and measurable impact."
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
              Topic tags
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className={`mt-2 ${inputClass}`}
                placeholder="research, innovation, student award (maximum 10)"
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
              Images * (1–10 JPEG, PNG, or WebP; 15 MB combined upload limit)
              <input
                required
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) =>
                  setImages(Array.from(e.target.files).slice(0, 10))
                }
                className={`mt-2 ${inputClass}`}
              />
              {images.length > 0 && (
                <span className="mt-2 block normal-case text-slate-500">
                  {images.length} image{images.length === 1 ? "" : "s"} selected
                </span>
              )}
            </label>
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
              Supporting file (optional; PDF, Word, or Excel; included in the 15
              MB total)
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className={`mt-2 ${inputClass}`}
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-xs font-black uppercase tracking-wider text-slate-600">
              Related UN Sustainable Development Goals
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sdgNames.map((name, index) => (
                <label
                  key={name}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs font-bold ${form.sdgs.includes(index + 1) ? "border-[#600018] bg-[#600018] text-white" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  <input
                    type="checkbox"
                    checked={form.sdgs.includes(index + 1)}
                    onChange={() => toggleSdg(index + 1)}
                    className="accent-[#D4AF37]"
                  />
                  SDG {index + 1}: {name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-end">
            <button
              disabled={busy}
              className="rounded-xl bg-[#600018] px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow disabled:opacity-50"
            >
              {busy ? "Submitting..." : "Submit for review"}
            </button>
          </div>
        </form>
      )}

      {(mode !== "dean" || deanView !== "compose") && (
        <div>
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading achievement posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No achievement posts are available in this workspace.
            </div>
          ) : (
            <div className="mx-auto grid max-w-5xl gap-10">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  canReview={mode === "review"}
                  onReview={reviewPost}
                  busy={busy}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
