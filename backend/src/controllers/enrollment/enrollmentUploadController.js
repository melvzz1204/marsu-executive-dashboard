// @desc    Upload and parse Consolidated Enrollment Excel sheet safely using ExcelJS
// @route   POST /api/v1/enrollment/upload
// @access  Private/Admin
exports.uploadEnrollmentExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload an Excel spreadsheet (.xlsx) file.",
      });
    }

    let academicYear = 2021; // Default fallback

    if (req.body && req.body.academicYear) {
      const match = String(req.body.academicYear).match(/\b(20\d{2})\b/);
      if (match) {
        academicYear = Number(match[1]); // returns 2022
      }
    }

    const semester = req.body.semester || "1st Sem";

    const savePromises = processedCampuses.map(async (campusName) => {
      const programsArray = campusDataMap[campusName];
      if (!programsArray || programsArray.length === 0) return;

      return EnrollmentAnalytics.findOneAndUpdate(
        { academicYear: academicYear, campus: campusName, semester: semester },
        {
          academicYear: academicYear,
          campus: campusName,
          semester: semester,
          programs: programsArray,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    });

    await Promise.all(savePromises.filter(Boolean));

    return res.status(201).json({
      success: true,
      message: `Successfully imported data for Academic Year ${academicYear} (${semester})!`,
      academicYear,
      semester,
      campusesImported: processedCampuses,
    });
  } catch (error) {
    console.error("Upload Failure:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
