const multer = require("multer");

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const EXCEL_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

const excelFileFilter = (req, file, callback) => {
  const hasAllowedExtension = /\.(xlsx|xls)$/i.test(file.originalname || "");
  const hasAllowedMimeType = EXCEL_MIME_TYPES.has(file.mimetype);

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    const error = new multer.MulterError(
      "LIMIT_UNEXPECTED_FILE",
      file.fieldname,
    );
    error.message = "Only Excel spreadsheet files (.xlsx or .xls) are allowed.";
    return callback(error);
  }

  return callback(null, true);
};

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
  fileFilter: excelFileFilter,
});

module.exports = { excelUpload, MAX_UPLOAD_SIZE_BYTES };
