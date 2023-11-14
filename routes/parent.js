const express = require("express");

const parentRouter = express.Router();
const {
  signUp,
  getSingleParent,
  addStudentToParent,
  getStudentsByParentId,
} = require("../controllers/parent");
const checkUserAuth = require("../middlewares/checkUserAuth");
const errorCatcher = require("../middlewares/errorCatcher");
const login = require("../middlewares/login");
const verifyToken = require("../middlewares/verifyToken");

parentRouter.post("/signup", errorCatcher(signUp));
parentRouter.post("/login", errorCatcher(login));
parentRouter.post(
  "/add",
  verifyToken,
  checkUserAuth("parent"),
  errorCatcher(addStudentToParent)
);
parentRouter.get(
  "/get/:ParentId",
  verifyToken,
  checkUserAuth("parent"),
  errorCatcher(getSingleParent)
);
parentRouter.get(
  "/getStudents/:ParentId",
  verifyToken,
  checkUserAuth("parent"),
  errorCatcher(getStudentsByParentId)
);

module.exports = parentRouter;
