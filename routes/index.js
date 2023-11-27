const express = require("express");
const adminRouter = require("./admin");
const studentRouter = require("./student");
const teacherRouter = require("./teacher");
const parentRouter = require("./parent");
const LanguageRouter = require("./language");
const login = require("../middlewares/login");
const logout = require("../middlewares/logout");
const errorCatcher = require("../middlewares/errorCatcher");
const { getSingleTeacher } = require("../controllers/student");
const paymentRouter = require("./payment");
const {
  forgetPassword,
  verifyCodeForgottenPassword,
  editForgottenPassword,
} = require("../middlewares/forgetPassword");
const currencyRouter = require("./currency");

const router = express.Router();

router.use("/admin", adminRouter);
router.use("/teacher", teacherRouter);
router.use("/student", studentRouter);
router.use("/parent", parentRouter);
router.use("/language", LanguageRouter);
router.use("/payment", paymentRouter);
router.post("/login", errorCatcher(login));
router.get("/logout", logout);
router.use("/teacherSession/:teacherId", getSingleTeacher);
router.post("/forgetPassword", errorCatcher(forgetPassword));
router.post("/forgetPassword/code", errorCatcher(verifyCodeForgottenPassword));
router.post("/forgetPassword/edit", errorCatcher(editForgottenPassword));
// Added by Abdelwahab
router.use("/currency", currencyRouter);
module.exports = router;
