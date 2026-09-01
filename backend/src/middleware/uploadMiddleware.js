const multer = require("multer");

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ACHIEVEMENT_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = MAX_ACHIEVEMENT_UPLOAD_SIZE_BYTES;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const EXCEL_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

const createExcelFileFilter =
  (extensionPattern, allowedFormats) => (req, file, callback) => {
    const hasAllowedExtension = extensionPattern.test(file.originalname || "");
    const hasAllowedMimeType = EXCEL_MIME_TYPES.has(file.mimetype);

    if (!hasAllowedExtension || !hasAllowedMimeType) {
      const error = new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        file.fieldname,
      );
      error.message = `Only Excel spreadsheet files (${allowedFormats}) are allowed.`;
      return callback(error);
    }

    return callback(null, true);
  };

const excelFileFilter = createExcelFileFilter(
  /\.(xlsx|xls)$/i,
  ".xlsx or .xls",
);
const xlsxFileFilter = createExcelFileFilter(/\.xlsx$/i, ".xlsx");

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
  fileFilter: excelFileFilter,
});

const xlsxUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
  fileFilter: xlsxFileFilter,
});

const achievementUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_ACHIEVEMENT_UPLOAD_SIZE_BYTES,
    files: 11,
    fields: 20,
  },
  fileFilter(req, file, callback) {
    const validImage =
      file.fieldname === "images" && IMAGE_MIME_TYPES.has(file.mimetype);
    const validAttachment =
      file.fieldname === "attachment" &&
      ATTACHMENT_MIME_TYPES.has(file.mimetype);

    if (!validImage && !validAttachment) {
      const error = new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        file.fieldname,
      );
      error.message =
        file.fieldname === "attachment"
          ? "Only PDF, Word, or Excel attachments are allowed."
          : "Only JPEG, PNG, or WebP achievement images are allowed.";
      return callback(error);
    }
    return callback(null, true);
  },
});

module.exports = {
  excelUpload,
  xlsxUpload,
  achievementUpload,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_ACHIEVEMENT_UPLOAD_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
};
