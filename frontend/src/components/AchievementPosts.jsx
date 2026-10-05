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

  if (count === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => setActiveIndex(0)}
          aria-label="Open image 1 of 1"
          title="Click to view full image"
          className="group relative block w-full cursor-zoom-in overflow-hidden bg-slate-950"
        >
          <ProtectedImage
            image={images[0]}
            className="max-h-[30rem] min-h-[16rem] w-full object-contain"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-slate-950/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 transition group-hover:opacity-100">
            Click to expand
          </span>
        </button>

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
            <div className="flex h-full w-full max-w-6xl flex-col items-center justify-center gap-4">
              <ProtectedImage
                image={images[activeIndex]}
                className="max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
              <p className="text-xs font-black uppercase tracking-widest text-white/70">
                {activeIndex + 1} of {count}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid h-72 grid-cols-2 grid-rows-2 gap-1 overflow-hidden bg-slate-950 sm:h-[30rem]">
        {visibleImages.map((image, index) => (
          <button
            key={image.id || index}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Open image ${index + 1} of ${count}`}
            title="Click to view full image"
            className={`group relative min-h-0 cursor-zoom-in overflow-hidden bg-slate-950 ${tileClass}`}
          >
            <ProtectedImage
              image={image}
              className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
            />
            {index === 3 && count > 4 && (
              <span className="absolute inset-0 grid place-items-center bg-slate-950/60 text-3xl font-black text-white sm:text-5xl">
                +{count - 4}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="bg-slate-950 px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-white/50">
        Preview cropped to fit grid · click any photo to view the full image
      </p>

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

const getExcerpt = (text = "", limit = 180) => {
  const clean = String(text).trim().replace(/\s+/g, " ");
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit).trimEnd()}...`;
};

function PostDetailModal({
  post,
  onClose,
  canReview,
  onReview,
  busy,
  canManage = false,
  onEdit,
  onDelete,
  deleting = false,
}) {
  const [feedback, setFeedback] = useState(post.review?.feedback || "");
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Read full story: ${post.title}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {post.images?.length > 0 && <ImageGallery images={post.images} />}
        <div className="space-y-5 p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#600018]">
                {post.category}
              </span>
              <StatusBadge status={post.status} />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close full story"
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200"
            >
              ×
            </button>
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
          {canManage && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={busy || deleting}
                onClick={() => onEdit?.(post)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-[#600018] transition hover:bg-slate-50 disabled:opacity-50"
              >
                ✎ Edit
              </button>
              <button
                type="button"
                disabled={busy || deleting}
                onClick={() => onDelete?.(post)}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "🗑 Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  canReview,
  onReview,
  busy,
  canManage = false,
  onEdit,
  onDelete,
  deleting = false,
}) {
  const [showDetail, setShowDetail] = useState(false);
  const coverImage = post.images?.[0];
  const extraCount = Math.max(0, (post.images?.length || 0) - 1);
  const excerpt = getExcerpt(post.subtitle ? `${post.subtitle} ${post.body || ""}` : post.body || "", 200);
  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl md:flex-row">
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          aria-label={`Read full story: ${post.title}`}
          title="Click to read full story"
          className="relative block w-full shrink-0 cursor-pointer overflow-hidden bg-slate-950 md:w-[42%] md:min-h-[22rem]"
        >
          {coverImage ? (
            <ProtectedImage
              image={coverImage}
              className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.03] md:h-full md:min-h-[22rem]"
            />
          ) : (
            <div className="grid h-64 w-full place-items-center bg-slate-100 text-xs font-bold text-slate-400 md:h-full md:min-h-[22rem]">
              No image
            </div>
          )}
          {extraCount > 0 && (
            <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
              +{extraCount} more photo{extraCount === 1 ? "" : "s"}
            </span>
          )}
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#600018] opacity-0 transition group-hover:opacity-100">
            Click to expand
          </span>
        </button>

        <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#600018]">
              {post.category}
            </span>
            <StatusBadge status={post.status} />
          </div>

          <h3 className="mt-3 line-clamp-2 text-xl font-black leading-snug text-slate-950 sm:text-2xl">
            {post.title}
          </h3>
          {post.subtitle && (
            <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-relaxed text-slate-500">
              {post.subtitle}
            </p>
          )}
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
            {excerpt}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-400">
            <span>{new Date(post.eventDate).toLocaleDateString()}</span>
            <span aria-hidden="true">•</span>
            <span className="truncate">{post.author?.name || "Dean"}</span>
            {post.location && (
              <>
                <span aria-hidden="true">•</span>
                <span className="truncate">{post.location}</span>
              </>
            )}
          </div>

          {(post.tags?.length > 0 || post.sdgs?.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600"
                >
                  #{tag}
                </span>
              ))}
              {post.sdgs?.slice(0, 3).map((sdg) => (
                <span
                  key={sdg}
                  title={sdgNames[sdg - 1]}
                  className="rounded-lg bg-[#600018] px-2 py-1 text-[11px] font-bold text-white"
                >
                  SDG {sdg}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#600018] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow transition hover:bg-[#7a0020]"
            >
              Read
              <span aria-hidden="true">→</span>
            </button>
            {canManage && (
              <>
                <button
                  type="button"
                  disabled={busy || deleting}
                  onClick={() => onEdit?.(post)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#600018] transition hover:bg-slate-50 disabled:opacity-50"
                >
                  ✎ Edit
                </button>
                <button
                  type="button"
                  disabled={busy || deleting}
                  onClick={() => onDelete?.(post)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "🗑 Delete"}
                </button>
              </>
            )}
          </div>
        </div>
      </article>

      {showDetail && (
        <PostDetailModal
          post={post}
          onClose={() => setShowDetail(false)}
          canReview={canReview}
          onReview={onReview}
          busy={busy}
          canManage={canManage}
          onEdit={(value) => {
            setShowDetail(false);
            onEdit?.(value);
          }}
          onDelete={onDelete}
          deleting={deleting}
        />
      )}
    </>
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
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editImages, setEditImages] = useState([]);
  const [editAttachment, setEditAttachment] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [confirmDeletePost, setConfirmDeletePost] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
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

  const canManagePost = (post) => {
    if (mode === "review") return true;
    if (mode === "dean") return post.status !== "approved";
    return false;
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
    setNotice(null);
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
      return setNotice({
        type: "error",
        text: "Choose no more than 10 replacement images.",
      });
    const newFiles = [
      ...editImages,
      ...(editAttachment ? [editAttachment] : []),
    ];
    const oversizedFile = newFiles.find(
      (file) => file.size > 15 * 1024 * 1024,
    );
    if (oversizedFile)
      return setNotice({
        type: "error",
        text: `${oversizedFile.name} exceeds the 15 MB file limit.`,
      });
    const totalUploadSize = newFiles.reduce(
      (total, file) => total + file.size,
      0,
    );
    if (totalUploadSize > 15 * 1024 * 1024)
      return setNotice({
        type: "error",
        text: "Replacement images and attachment must not exceed 15 MB in total.",
      });
    const payload = new FormData();
    Object.entries(editForm).forEach(([key, value]) =>
      payload.append(key, key === "sdgs" ? JSON.stringify(value) : value),
    );
    editImages.forEach((image) => payload.append("images", image));
    if (editAttachment) payload.append("attachment", editAttachment);
    if (removeAttachment) payload.append("removeAttachment", "true");
    setEditBusy(true);
    setNotice(null);
    try {
      const { data } = await api.patch(
        `/achievement-posts/${editingPost._id}`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setNotice({ type: "success", text: data.message });
      closeEdit();
      await loadPosts();
      await onStatusChange?.();
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Update failed.",
      });
    } finally {
      setEditBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmDeletePost) return;
    setDeletingId(confirmDeletePost._id);
    setNotice(null);
    try {
      const { data } = await api.delete(
        `/achievement-posts/${confirmDeletePost._id}`,
      );
      setNotice({ type: "success", text: data.message });
      setConfirmDeletePost(null);
      await loadPosts();
      await onStatusChange?.();
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Delete failed.",
      });
    } finally {
      setDeletingId(null);
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
            <div className="text-xs font-black uppercase tracking-wider text-slate-600 sm:col-span-2">
              <label>
                Images * (1–10 JPEG, PNG, or WebP; 15 MB combined upload limit;
                full photo is kept — grid only crops the preview)
                <input
                  required={images.length === 0}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) =>
                    setImages(Array.from(e.target.files).slice(0, 10))
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              {images.length > 0 && (
                <span className="mt-2 block normal-case text-slate-500">
                  {images.length} image{images.length === 1 ? "" : "s"} selected
                  — shown below uncropped
                </span>
              )}
              <FilePreviewGrid
                files={images}
                onRemove={(index) =>
                  setImages((current) =>
                    current.filter((_, position) => position !== index),
                  )
                }
              />
            </div>
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
                  canManage={canManagePost(post)}
                  onEdit={startEdit}
                  onDelete={setConfirmDeletePost}
                  deleting={deletingId === post._id}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
    </section>
  );
}
