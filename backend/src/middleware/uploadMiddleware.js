const multer = require("multer");

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
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

module.exports = { excelUpload, xlsxUpload, MAX_UPLOAD_SIZE_BYTES };
