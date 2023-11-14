const express = require("express");

const studentRouter = express.Router();
const {
  signUp,
  signPassword,
  signData,
  getStudents,
  getSingleStudent,
  getLastTenStudent,
  verifyCode,
  editPersonalInformation,
  editImageStudent,
  resetPassword,
  getSingleTeacher,
  getStudentCredit,
  getWalletHistory,
  getAllLessons,
  getComingLessons,
  getPreviousLessons,
  rateTeacher,
  getSubjectByCategoryId,
  getCurriculumByLevelId,
  getClassByLevelId,
  acceptLesson,
  nearestTeachers,
} = require("../controllers/student");
const checkUserAuth = require("../middlewares/checkUserAuth");
const verifyToken = require("../middlewares/verifyToken");
const errorCatcher = require("../middlewares/errorCatcher");

studentRouter.post("/signup", errorCatcher(signUp));
studentRouter.post("/signup/code", errorCatcher(verifyCode));
studentRouter.post("/signup/pass", errorCatcher(signPassword));
studentRouter.post("/signup/data", errorCatcher(signData));
studentRouter.post(
  "/editAbout/:StudentId",
  verifyToken,
  checkUserAuth("student"),
  errorCatcher(editPersonalInformation)
);
studentRouter.post(
  "/editImage/:StudentId",
  verifyToken,
  checkUserAuth("student"),
  errorCatcher(editImageStudent)
);
studentRouter.get("/all", errorCatcher(getStudents));
studentRouter.get("/get/:studentId", errorCatcher(getSingleStudent));
studentRouter.get(
  "/getLastTen",
  verifyToken,
  checkUserAuth("admin"),
  errorCatcher(getLastTenStudent)
);

studentRouter.get("/Credit/:studentId", errorCatcher(getStudentCredit));

studentRouter.get("/wallet/:studentId", errorCatcher(getWalletHistory));

studentRouter.get("/lessons/:studentId", errorCatcher(getAllLessons));

studentRouter.get("/comingLessons/:studentId", errorCatcher(getComingLessons));

studentRouter.get(
  "/previousLessons/:studentId",
  errorCatcher(getPreviousLessons)
);

studentRouter.put(
  "/resetPassword/:StudentId",
  verifyToken,
  checkUserAuth("student"),
  errorCatcher(resetPassword)
);

studentRouter.post(
  "/rateTeacher",
  verifyToken,
  checkUserAuth("student"),
  errorCatcher(rateTeacher)
);
studentRouter.get("/class/:levelId", errorCatcher(getClassByLevelId));
studentRouter.get("/curriculum/:levelId", errorCatcher(getCurriculumByLevelId));

studentRouter.get("/subject/:id/all", errorCatcher(getSubjectByCategoryId));

studentRouter.patch(
  "/acceptLesson/:StudentId",
  verifyToken,
  checkUserAuth("student"),
  errorCatcher(acceptLesson)
);

studentRouter.get(
  "/nearestTeachers/:StudentId",
  verifyToken,
  checkUserAuth("student"),
  errorCatcher(nearestTeachers)
);

module.exports = studentRouter;
