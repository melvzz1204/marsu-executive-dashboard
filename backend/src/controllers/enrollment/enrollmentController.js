const ExcelJS = require("exceljs");
const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");

// 1. Spreadsheet Upload Handler
exports.uploadEnrollment = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: "Please upload an Excel spreadsheet (.xlsx) file.",
      });
    }

    const academicYear = req.body.academicYear || "2021-2022";
    const semester = req.body.semester || "1st Sem";

    const processedCampuses = [];

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    workbook.eachSheet((worksheet) => {
      const campusName = worksheet.name;
      const rows = [];

      const headerRow = worksheet.getRow(1);
      const headers = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value
          ? cell.value.toString().trim()
          : `col_${colNumber}`;
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData = {};
        let hasValue = false;

        row.eachCell((cell, colNumber) => {
          const headerKey = headers[colNumber] || `col_${colNumber}`;

          let val = cell.value;
          if (val && typeof val === "object" && val.result !== undefined) {
            val = val.result;
          }

          rowData[headerKey] = val;
          hasValue = true;
        });

        if (hasValue) {
          rows.push(rowData);
        }
      });

      if (rows.length > 0) {
        processedCampuses.push({
          campus: campusName,
          academicYear,
          semester,
          records: rows,
        });
      }
    });

    for (const data of processedCampuses) {
      await EnrollmentAnalytics.findOneAndUpdate(
        {
          campus: data.campus,
          academicYear: data.academicYear,
          semester: data.semester,
        },
        data,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported data for Academic Year ${academicYear}!`,
      academicYear,
      processedCount: processedCampuses.length,
      data: processedCampuses,
    });
  } catch (error) {
    console.error("ExcelJS Upload Failure:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. 💡 ADDED: Snapshot Fetch Handler
exports.getEnrollmentSnapshot = async (req, res) => {
  try {
    const data = await EnrollmentAnalytics.find();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. 💡 ADDED: Multi-Year Trend Line Handler
exports.getEnrollmentTrend = async (req, res) => {
  try {
    const data = await EnrollmentAnalytics.find().sort({ academicYear: 1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 4. 💡 ADDED: Manual Ingestion / Upsert Handler
exports.upsertEnrollmentAnalytics = async (req, res) => {
  try {
    const { campus, academicYear, semester, records } = req.body;
    const updated = await EnrollmentAnalytics.findOneAndUpdate(
      { campus, academicYear, semester },
      req.body,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
