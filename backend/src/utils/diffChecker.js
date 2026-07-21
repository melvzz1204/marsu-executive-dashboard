// utils/diffChecker.js

/**
 * Compares an array of parsed spreadsheet program objects against
 * existing database program subdocuments for a given campus.
 *
 * @param {Array} existingPrograms - Program array stored in MongoDB
 * @param {Array} incomingPrograms - Program array parsed from Excel
 * @returns {Array} List of field-level differences
 */
exports.compareCampusPrograms = (existingPrograms = [], incomingPrograms = []) => {
  const changes = [];
  const existingProgramsMap = new Map();

  // Map existing program student counts for fast O(1) lookup
  existingPrograms.forEach((p) => {
    existingProgramsMap.set(p.programName, p.studentCount);
  });

  incomingPrograms.forEach((inProg) => {
    const oldStudentCount = existingProgramsMap.get(inProg.programName);

    if (oldStudentCount === undefined) {
      // Program doesn't exist in current record
      changes.push({
        programName: inProg.programName,
        field: "studentCount",
        oldValue: "NEW PROGRAM",
        newValue: inProg.studentCount,
      });
    } else if (oldStudentCount !== inProg.studentCount) {
      // Student count changed
      changes.push({
        programName: inProg.programName,
        field: "studentCount",
        oldValue: oldStudentCount,
        newValue: inProg.studentCount,
      });
    }
  });

  return changes;
};