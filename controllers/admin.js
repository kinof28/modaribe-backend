const {
  Admin,
  Class,
  Level,
  Subject,
  SubjectCategory,
  Curriculum,
  CurriculumLevel,
  ParentStudent,
  Student,
  Teacher,
  LanguageLevel,
  Session,
  Wallet,
  Parent,
  SocialMedia,
  CheckoutRequest,
  LangTeachStd,
  CurriculumTeacher,
  TeacherLevel,
  RemoteSession,
  F2FSessionStd,
  F2FSessionTeacher,
  Certificates,
  Experience,
  EducationDegree,
  TeacherDay,
} = require("../models");
const { PDFDocument } = require("pdf-lib");
const path = require("path");
const fs = require("fs");
const pdf = require("html-pdf");
const sendEmail = require("../middlewares/sendEmail");

const {
  validateAdminSignUp,
  loginValidation,
  profitValidation,
} = require("../validation");
const { serverErrs } = require("../middlewares/customError");
const { compare, hash } = require("bcrypt");
const generateToken = require("../middlewares/generateToken");
const { Op } = require("sequelize");
const FinancialRecord = require("../models/financialRecord");
const { Notifications } = require("../firebaseConfig");
const { promisify } = require("util");
const TeacherSubject = require("../models/TeacherSubject");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const signUp = async (req, res) => {
  const { name, email, password } = req.body;
  await validateAdminSignUp.validate({ name, email, password });
  const admin = await Admin.findOne({
    where: {
      email,
    },
  });
  if (admin)
    throw serverErrs.BAD_REQUEST({
      arabic: "الإيميل مستخدم سابقا",
      english: "email is already used",
    });

  const hashedPassword = await hash(password, 12);

  const newAdmin = await Admin.create(
    {
      name,
      email,
      password: hashedPassword,
    },
    {
      returning: true,
    }
  );
  await newAdmin.save();
  const { id } = newAdmin;
  const token = await generateToken({ userId: id, name, role: "admin" });
  console.log(token);
  // res.cookie("token", token);

  res.send({
    status: 201,
    data: newAdmin,
    msg: { arabic: "تم التسجيل بنجاح", english: "successful sign up" },
    token: token,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  await loginValidation.validate({ email, password });

  const admin = await Admin.findOne({ where: { email } });
  if (!admin)
    throw serverErrs.BAD_REQUEST({
      arabic: "خطأ في الإيميل أو كلمة السر",
      english: "Wrong Email Or Password",
    });

  const result = await compare(password, admin.password);
  if (!result)
    throw serverErrs.BAD_REQUEST({
      arabic: "خطأ في الإيميل أو كلمة السر",
      english: "Wrong Email Or Password",
    });

  const { id, name } = admin;

  const token = await generateToken({ userId: id, name, role: "admin" });
  // res.cookie("token", token);

  res.send({
    status: 201,
    data: admin,
    msg: { arabic: "تم تسجيل الدخول بنجاح", english: "successful log in" },
    token: token,
  });
};

// Added by Abdelwahab
const createStudent = async (req, res) => {
  const { email, phoneNumber, name, location, password } = req.body;
  const teacher = await Teacher.findOne({
    where: {
      email,
    },
  });

  const student = await Student.findOne({
    where: {
      email,
    },
  });
  const parent = await Parent.findOne({
    where: {
      email,
    },
  });
  if (teacher || student || parent)
    throw serverErrs.BAD_REQUEST({
      arabic: "الإيميل مستخدم سابقا",
      english: "email is already used",
    });
  hashedPassword = await hash(password, 12);
  const newStudent = await Student.create({
    email,
    name,
    location,
    phoneNumber: "+" + phoneNumber,
    password: hashedPassword,
    isRegistered: true,
  });
  const mailOptions = {
    from: "info@modaribe.com",
    to: email,
    subject: "modaribe: New Student Account",
    html: `<div style="text-align: right;"> مرحبًا ، <br> 
       يسعدنا إخبارك بأنه تم إنشاء حساب لك من طرف مدير موقع مدربي <br>
    يمكنك تسجيل الدخول الآن باستخدام هذا الإيميل وكلمة السر: ${password} <br>
    .حظًا سعيدًا <br>
    ,فريق مدربي
    </div>`,
  };
  const smsOptions = {
    body: ` مرحبًا ، 
    يسعدنا إخبارك بأنه تم إنشاء حساب لك من طرف مدير موقع مدربي 
 يمكنك تسجيل الدخول الآن باستخدام هذا الإيميل وكلمة السر: ${password} 
 .حظًا سعيدًا
    ,فريق مدربي
    `,
    to: phoneNumber,
  };
  sendEmail(mailOptions, smsOptions);
  res.send({
    status: 201,
    data: null,
    msg: {
      arabic: "تم إنشاء الحساب بنجاح",
      english: "successfully created new account",
    },
  });
};
const createTeacher = async (req, res) => {
  const { email, phone, password } = req.body;
  const teacher = await Teacher.findOne({
    where: {
      email,
    },
  });

  const student = await Student.findOne({
    where: {
      email,
    },
  });

  const parent = await Parent.findOne({
    where: {
      email,
    },
  });
  if (teacher || student || parent)
    throw serverErrs.BAD_REQUEST({
      arabic: "الإيميل مستخدم سابقا",
      english: "email is already used",
    });
  hashedPassword = await hash(password, 12);
  const newTeacher = await Teacher.create({
    email,
    phone: "+" + phone,
    password: hashedPassword,
    isRegistered: true,
    isVerified: true,
  });
  const mailOptions = {
    from: "info@modaribe.com",
    to: email,
    subject: "modaribe: New Teacher Account",
    html: `<div style="text-align: right;"> مرحبًا ، <br> 
       يسعدنا إخبارك بأنه تم إنشاء حساب لك من طرف مدير موقع مدربي <br>
    يمكنك تسجيل الدخول الآن كمعلم باستخدام هذا الإيميل وكلمة السر: ${password} <br>
    .حظًا سعيدًا <br>
    ,فريق مدربي
    </div>`,
  };
  const smsOptions = {
    body: ` مرحبًا ، 
    يسعدنا إخبارك بأنه تم إنشاء حساب لك من طرف مدير موقع مدربي 
 يمكنك تسجيل الدخول الآن كمعلم باستخدام هذا الإيميل وكلمة السر: ${password} 
 .حظًا سعيدًا
    ,فريق مدربي
    `,
    to: phone,
  };
  sendEmail(mailOptions, smsOptions);
  res.send({
    status: 201,
    data: null,
    msg: {
      arabic: "تم إنشاء الحساب بنجاح",
      english: "successfully created new account",
    },
  });
};

const getNewCheckoutRequests = async (req, res) => {
  const checkouts = await CheckoutRequest.findAll({
    where: { status: { [Op.eq]: 0 } },
    order: [["createdAt", "DESC"]],
    include: [{ model: Teacher }],
  });
  res.send({
    status: 201,
    data: checkouts,
    msg: {
      arabic: "تم إرجاع جميع طلبات الدفع الجديدة",
      english: "successful get new Checkout Requests",
    },
  });
};

const getProcessedCheckoutRequests = async (req, res) => {
  const checkouts = await CheckoutRequest.findAll({
    where: { status: { [Op.ne]: 0 } },
    order: [["updatedAt", "DESC"]],
    include: [{ model: Teacher }],
  });
  res.send({
    status: 201,
    data: checkouts,
    msg: {
      arabic: "تم إرجاع جميع طلبات الدفع المنتهية",
      english: "successful get processed Checkout Requests",
    },
  });
};

const acceptCheckout = async (req, res) => {
  const { checkoutId } = req.params;
  const checkout = await CheckoutRequest.findOne({
    where: {
      id: checkoutId,
    },
  });
  if (!checkout) {
    throw new serverErrs.BAD_REQUEST({
      arabic: "طلب الدفع غير موجود",
      english: "checkout request not found",
    });
  }
  await checkout.update({ status: 1 });
  res.send({
    status: 201,
    msg: {
      arabic: "تم قبول طلب الدفع بنجاح",
      english: "successful accepting Checkout Requests",
    },
  });
};

const rejectCheckout = async (req, res) => {
  const { checkoutId } = req.params;
  const checkout = await CheckoutRequest.findOne({
    where: {
      id: checkoutId,
    },
  });
  if (!checkout) {
    throw new serverErrs.BAD_REQUEST({
      arabic: "طلب الدفع غير موجود",
      english: "checkout request not found",
    });
  }
  await checkout.update({ status: -1 });

  res.send({
    status: 201,
    msg: {
      arabic: "تم رفض طلب الدفع بنجاح",
      english: "successful rejecting Checkout Requests",
    },
  });
};

const createSubjectCategory = async (req, res) => {
  const image = req.file.filename;
  const { titleAR, titleEN } = req.body;
  const newSubjectCategory = await SubjectCategory.create(
    {
      titleAR,
      titleEN,
      image,
    },
    {
      returning: true,
    }
  );
  await newSubjectCategory.save();
  res.send({
    status: 201,
    data: newSubjectCategory,
    msg: {
      arabic: "تم إنشاء المادة العامة بنجاح",
      english: "successful create new SubjectCategory",
    },
  });
};

const createSubject = async (req, res) => {
  const { titleAR, titleEN, subjectCategoryId } = req.body;
  const newSubject = await Subject.create(
    {
      titleAR,
      titleEN,
      SubjectCategoryId: subjectCategoryId,
    },
    {
      returning: true,
    }
  );
  await newSubject.save();
  res.send({
    status: 201,
    data: newSubject,
    msg: {
      arabic: "تم إنشاء المادة الفرعية بنجاح",
      english: "successful create new Subject",
    },
  });
};

const createLevel = async (req, res) => {
  const { titleAR, titleEN } = req.body;
  const newLevel = await Level.create(
    {
      titleAR,
      titleEN,
    },
    {
      returning: true,
    }
  );
  await newLevel.save();
  res.send({
    status: 201,
    data: newLevel,
    msg: {
      arabic: "تم إنشاء المستوى بنجاح",
      english: "successful create new level",
    },
  });
};

const createClass = async (req, res) => {
  const { titleAR, titleEN, levelId } = req.body;
  const newClassCreated = await Class.create(
    {
      titleAR,
      titleEN,
      LevelId: levelId,
    },
    {
      returning: true,
    }
  );
  await newClassCreated.save();
  res.send({
    status: 201,
    data: newClassCreated,
    msg: {
      arabic: "تم إنشاء الفصل بنجاح",
      english: "successful create new class",
    },
  });
};

const createCurriculum = async (req, res) => {
  const { titleAR, titleEN } = req.body;
  const newCurriculum = await Curriculum.create(
    {
      titleAR,
      titleEN,
    },
    {
      returning: true,
    }
  );
  await newCurriculum.save();
  res.send({
    status: 201,
    data: newCurriculum,
    msg: {
      arabic: "تم إنشاء المنهج بنجاح",
      english: "successful create new curriculum",
    },
  });
};

const linkedCurriculumLevel = async (req, res) => {
  const { levelId, curriculumId } = req.body;
  const curriculumLevel = await CurriculumLevel.findOne({
    where: {
      CurriculumId: curriculumId,
      LevelId: levelId,
    },
  });

  if (curriculumLevel)
    throw serverErrs.BAD_REQUEST({
      arabic: "تم ربط المنهج بالمستوى سابقا",
      english: "already linked curriculum with level",
    });

  const newCurriculumLevel = await CurriculumLevel.create(
    {
      CurriculumId: curriculumId,
      LevelId: levelId,
    },
    {
      returning: true,
    }
  );
  await newCurriculumLevel.save();
  res.send({
    status: 201,
    data: newCurriculumLevel,
    msg: {
      arabic: "تم ربط المنهج بالمستوى بنجاح",
      english: "successful linked curriculum with level",
    },
  });
};

const getSubjects = async (req, res) => {
  const subjects = await Subject.findAll({ include: { all: true } });
  res.send({
    status: 201,
    data: subjects,
    msg: {
      arabic: "تم ارجاع جميع المواد بنجاح",
      english: "successful get all Subjects",
    },
  });
};

const getSingleSubject = async (req, res) => {
  const { subjectId } = req.params;
  const subject = await Subject.findOne({
    where: { id: subjectId },
    include: { all: true },
  });
  if (!subject)
    throw serverErrs.BAD_REQUEST({
      arabic: "المادة غير موجودة",
      english: "Invalid subjectId! ",
    });
  res.send({
    status: 201,
    data: subject,
    msg: {
      arabic: "تم ارجاع المادة بنجاح",
      english: "successful get single subject",
    },
  });
};

const getSubjectCategories = async (req, res) => {
  const subjectCategories = await SubjectCategory.findAll({
    include: { all: true },
  });
  res.send({
    status: 201,
    data: subjectCategories,
    msg: {
      arabic: "تم ارجاع المادة العامة بنجاح",
      english: "successful get all subjectCategories",
    },
  });
};

const getSingleSubjectCategory = async (req, res) => {
  const { subjectCategoryId } = req.params;
  const subjectCategory = await SubjectCategory.findOne({
    where: { id: subjectCategoryId },
    include: { all: true },
  });
  if (!subjectCategory)
    throw serverErrs.BAD_REQUEST({
      arabic: "المادة غير موجودة",
      english: "Invalid subjectCategoryId! ",
    });
  res.send({
    status: 201,
    data: subjectCategory,
    msg: {
      arabic: "تم ارجاع المادة بنجاح",
      english: "successful get single subjectCategory",
    },
  });
};

const getClasses = async (req, res) => {
  const classes = await Class.findAll({ include: Level });
  res.send({
    status: 201,
    data: classes,
    msg: {
      arabic: "تم ارجاع جميع الفصول بنجاح",
      english: "successful get all classes",
    },
  });
};

const getSingleClass = async (req, res) => {
  const { classId } = req.params;
  const singleClass = await Class.findOne({
    where: { id: classId },
    include: { all: true },
  });
  if (!singleClass)
    throw serverErrs.BAD_REQUEST({
      arabic: "الفصل غير موجود",
      english: "Invalid classId! ",
    });
  res.send({
    status: 201,
    data: singleClass,
    msg: {
      arabic: "تم ارجاع الفصل بنجاح",
      english: "successful get single singleClass",
    },
  });
};

const getLevels = async (req, res) => {
  const levels = await Level.findAll();
  res.send({
    status: 201,
    data: levels,
    msg: {
      arabic: "تم ارجاع جميع المستويات بنجاح",
      english: "successful get all levels",
    },
  });
};

const getSingleLevel = async (req, res) => {
  const { levelId } = req.params;
  const level = await Level.findOne({
    where: { id: levelId },
    include: [{ model: Class }, { model: CurriculumLevel }],
  });
  if (!level)
    throw serverErrs.BAD_REQUEST({
      arabic: "المستوى غير موجود",
      english: "Invalid levelId! ",
    });
  res.send({
    status: 201,
    data: level,
    msg: {
      arabic: "تم ارجاع المستوى بنجاح",
      english: "successful get single level",
    },
  });
};

const getCurriculums = async (req, res) => {
  const curriculums = await Curriculum.findAll({ include: CurriculumLevel });
  res.send({
    status: 201,
    data: curriculums,
    msg: {
      arabic: "تم ارجاع جميع المناهج بنجاح",
      english: "successful get all Curriculums",
    },
  });
};

const getSingleCurriculum = async (req, res) => {
  const { curriculumId } = req.params;
  const curriculum = await Curriculum.findOne({
    where: { id: curriculumId },
    include: { all: true },
  });
  if (!curriculum)
    throw serverErrs.BAD_REQUEST({
      arabic: "المنهج غير موجود",
      english: "Invalid curriculumId! ",
    });
  res.send({
    status: 201,
    data: curriculum,
    msg: {
      arabic: "تم ارجاع المنهج بنجاح",
      english: "successful get single curriculum",
    },
  });
};

const acceptStudent = async (req, res) => {
  const { ParentStudentId } = req.params;
  const parentStudent = await ParentStudent.findOne({
    where: { id: ParentStudentId },
    include: { all: true },
  });
  if (!parentStudent)
    throw serverErrs.BAD_REQUEST({
      arabic: "الأب غير موجود",
      english: "parent student not found",
    });

  await parentStudent.update({ status: 1 });
  const student = await Student.findOne({
    where: { id: parentStudent.StudentId },
    include: { all: true },
  });
  await student.update({ ParentId: parentStudent.ParentId });
  res.send({
    status: 201,
    msg: {
      arabic: "تم قبول الطالب بنجاح",
      english: "Student has been accepted",
    },
  });
};

const rejectStudent = async (req, res) => {
  const { ParentStudentId } = req.params;
  const parentStudent = await ParentStudent.findOne({
    where: { id: ParentStudentId },
    include: { all: true },
  });
  if (!parentStudent)
    throw serverErrs.BAD_REQUEST({
      arabic: "الأب غير موجود",
      english: "parent student not found",
    });

  await parentStudent.update({ status: -1 });
  res.send({
    status: 201,
    msg: {
      arabic: "تم رفض الطالب بنجاح",
      english: "Student has been rejected",
    },
  });
};

const getParentStudentWaiting = async (req, res) => {
  const parentStudents = await ParentStudent.findAll({
    where: { status: 0 },
    include: { all: true },
  });

  res.send({
    status: 201,
    data: parentStudents,
    msg: {
      arabic: "تم ارجاع جميع طلبات الأب بنجاح",
      english: "successful get all Students are waiting",
    },
  });
};

const getParentStudentAccOrRej = async (req, res) => {
  const parentStudents = await ParentStudent.findAll({
    where: { status: { [Op.or]: [1, -1] } },
    include: { all: true },
  });

  res.send({
    status: 201,
    data: parentStudents,
    msg: {
      arabic: "تم ارجاع جميع طلبات الأب المقبولة",
      english: "successful get all Students are accepted",
    },
  });
};

const acceptTeacher = async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await Teacher.findOne({
    where: { id: teacherId },
  });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "invalid trainerId!",
    });

  await teacher.update({ isVerified: true });

  res.send({
    status: 201,
    data: teacher,
    msg: {
      arabic: "تم قبول المدرب بنجاح",
      english: "trainer has been accepted",
    },
  });
};

const getAcceptedTeachers = async (req, res) => {
  const acceptedTeachers = await Teacher.findAll({
    where: { isVerified: true },
  });

  res.send({
    status: 201,
    data: acceptedTeachers,
    msg: {
      arabic: "تم ارجاع جميع المدربين المقبولين",
      english: "successful get all acceptedTrainers",
    },
  });
};

const rejectTeacher = async (req, res) => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findOne({ where: { id: teacherId } });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });
  await Teacher.destroy({
    where: {
      id: teacherId,
    },
  });

  res.send({
    status: 201,
    msg: { arabic: "تم رفض المدرب", english: "Rejected trainer successfully" },
  });
};

const getWaitingTeacher = async (req, res) => {
  const teachers = await Teacher.findAll({
    where: {
      isVerified: false,
      firstName: { [Op.gt]: "" },
      lastName: { [Op.gt]: "" },
      phone: { [Op.gt]: "" },
      gender: { [Op.gt]: "" },
      image: { [Op.gt]: "" },
      dateOfBirth: { [Op.gt]: "" },
      country: { [Op.gt]: "" },
      city: { [Op.gt]: "" },
      favStdGender: { [Op.gt]: "" },
      favhours: { [Op.gt]: "" },
      shortHeadlineAr: { [Op.gt]: "" },
      shortHeadlineEn: { [Op.gt]: "" },
      descriptionAr: { [Op.gt]: "" },
      descriptionEn: { [Op.gt]: "" },
    },
  });
  res.send({
    status: 201,
    data: teachers,
    msg: {
      arabic: "تم ارجاع جميع المدربين غير المقبولين بعد",
      english: "successful get all waiting trainers",
    },
  });
};

const getLanguageLevel = async (req, res) => {
  const languageLevels = await LanguageLevel.findAll();
  res.send({
    status: 201,
    data: languageLevels,
    msg: {
      arabic: "تم ارجاع جميع مستويات اللغة",
      english: "successful get all language level",
    },
  });
};

const updateLevel = async (req, res) => {
  const { titleAR, titleEN } = req.body;
  const { LevelId } = req.params;
  const level = await Level.findOne({
    where: { id: LevelId },
    include: { all: true },
  });
  if (!level)
    throw serverErrs.BAD_REQUEST({
      arabic: "المستوى غير موجود",
      english: "level not found",
    });
  await level.update({ titleAR, titleEN });
  res.send({
    status: 201,
    data: level,
    msg: {
      arabic: "تم تعديل المستوى بنجاح",
      english: "successful update level",
    },
  });
};

const updateSubCategories = async (req, res) => {
  const { titleAR, titleEN } = req.body;
  const { SubjectCategoryId } = req.params;
  const subjectCategory = await SubjectCategory.findOne({
    where: { id: SubjectCategoryId },
    include: { all: true },
  });
  if (!subjectCategory)
    throw serverErrs.BAD_REQUEST({
      arabic: "المادة العامة غير موجودة",
      english: "subjectCategory not found",
    });
  const clearImage = (filePath) => {
    filePath = path.join(__dirname, "..", `images/${filePath}`);
    fs.unlink(filePath, (err) => {
      if (err)
        throw serverErrs.BAD_REQUEST({
          arabic: "الصورة غير موجودة",
          english: "Image not found",
        });
    });
  };
  if (req.file && subjectCategory.image) {
    clearImage(subjectCategory.image);
  }
  if (req.file) {
    await subjectCategory.update({ image: req.file.filename });
  }
  await subjectCategory.update({ titleAR, titleEN });
  res.send({
    status: 201,
    data: subjectCategory,
    msg: {
      arabic: "تم تعديل المادة العامة بنجاح",
      english: "successful update subjectCategory",
    },
  });
};

const updateSubject = async (req, res) => {
  const { titleAR, titleEN } = req.body;
  const { SubjectId } = req.params;
  const subject = await Subject.findOne({
    where: { id: SubjectId },
    include: { all: true },
  });
  if (!subject)
    throw serverErrs.BAD_REQUEST({
      arabic: "المادة غير موجودة",
      english: "Subject not found",
    });
  await subject.update({ titleAR, titleEN });
  res.send({
    status: 201,
    data: subject,
    msg: {
      arabic: "تم تعديل المادة الفرعية بنجاح",
      english: "successful update subject",
    },
  });
};

const updateClass = async (req, res) => {
  const { titleAR, titleEN } = req.body;
  const { ClassId } = req.params;
  const classes = await Class.findOne({
    where: { id: ClassId },
    include: { all: true },
  });
  if (!classes)
    throw serverErrs.BAD_REQUEST({
      arabic: "الفصل غير موجود",
      english: "Class not found",
    });
  await classes.update({ titleAR, titleEN });
  res.send({
    status: 201,
    data: classes,
    msg: { arabic: "تم تعديل الفصل بنجاح", english: "successful update Class" },
  });
};

const updateCurriculum = async (req, res) => {
  const { titleAR, titleEN } = req.body;
  const { CurriculumId } = req.params;
  const curriculum = await Curriculum.findOne({
    where: { id: CurriculumId },
    include: { all: true },
  });
  if (!curriculum)
    throw serverErrs.BAD_REQUEST({
      arabic: "المنهج غير موجود",
      english: "Curriculum not found",
    });
  await curriculum.update({ titleAR, titleEN });
  res.send({
    status: 201,
    data: curriculum,
    msg: {
      arabic: "تم تعديل المنهج بنجاح",
      english: "successful update curriculum",
    },
  });
};

const payDues = async (req, res) => {
  const { price, TeacherId } = req.body;

  const teacher = await Teacher.findOne({
    where: {
      id: TeacherId,
    },
  });
  if (teacher.totalAmount - teacher.dues < price) {
    throw serverErrs.BAD_REQUEST({
      arabic: "  انت تدفع اكثر من المبلغ المطلوب",
      english: "you are paying more than the requested price",
    });
  }
  await FinancialRecord.create({
    amount: price,
    type: "paid",
    TeacherId,
  });

  teacher.dues += +price;
  await teacher.save();

  await Notifications.add({
    titleAR: "تم دفع المستحقات  ",
    titleEn: "successfully paying dues ",
    TeacherId,
    seen: false,
    date: Date.now(),
  });

  res.send({
    status: 201,
    data: teacher,
    msg: {
      arabic: "تم الدفع للمعلم بنجاح",
      english: "successful paid to teacher",
    },
  });
};

const getAllSessions = async (req, res) => {
  const lessons = await Session.findAll({
    where: {
      isPaid: true,
    },
    include: [{ model: Student }, { model: Teacher }],
  });

  res.send({
    status: 201,
    data: lessons,
    msg: {
      arabic: "تم ارجاع الجلسات بنجاح",
      english: "successful get all lessons",
    },
  });
};

const getAllWallets = async (req, res) => {
  const wallets = await Wallet.findAll({
    where: {
      isPaid: true,
    },
    order: [["createdAt", "DESC"]],
    limit: 20000,
    include: [{ model: Student }],
  });

  res.send({
    status: 201,
    data: wallets,
    msg: {
      arabic: "تم ارجاع جميع المحفظات",
      english: "successful get all wallets",
    },
  });
};

const getStudentWallets = async (req, res) => {
  const { StudentId } = req.params;

  const wallets = await Wallet.findAll({
    where: {
      StudentId,
      isPaid: true,
    },
  });
  res.send({
    status: 201,
    data: wallets,
    msg: {
      arabic: "تم ارجاع محفظة الطالب بنجاح",
      english: "successful get all student wallets",
    },
  });
};

const getThawaniSession = async (req, res) => {
  const { StudentId } = req.params;

  const sessions = await Session.findAll({
    where: {
      StudentId,
      typeOfPayment: "thawani",
      isPaid: true,
    },
  });

  res.send({
    status: 201,
    data: sessions,
    msg: {
      arabic: "تم ارجاع جميع الجلسات التي تم تسجيلها من منصة ثواني",
      english: "successful get all thawani session",
    },
  });
};

const getAllTeachers = async (req, res) => {
  const teachers = await Teacher.findAll({
    where: {
      isVerified: true,
      isRegistered: true,
    },
  });

  res.send({
    status: 201,
    data: teachers,
    msg: {
      arabic: "تم ارجاع جميع المدربين",
      english: "successful get all trainers",
    },
  });
};

const getTeacherFinancial = async (req, res) => {
  const { TeacherId } = req.params;

  const records = await FinancialRecord.findAll({
    where: {
      TeacherId,
    },
  });

  res.send({
    status: 201,
    data: records,
    msg: {
      arabic: "تم ارجاع جميع السجل المالي للمعلم",
      english: "successful get all financial records for teacher",
    },
  });
};

const getNumbers = async (req, res) => {
  const studentsNumber = await Student.count({
    where: {
      isRegistered: true,
    },
  });

  const teachersNumber = await Teacher.count({
    where: {
      isRegistered: true,
      isVerified: true,
    },
  });

  const parentsNumber = await Parent.count();

  const sessionsNumber = await Session.count({
    where: {
      isPaid: true,
    },
  });

  res.send({
    status: 201,
    data: { studentsNumber, teachersNumber, parentsNumber, sessionsNumber },
    msg: {
      arabic: "تم ارجاع جميع الطلاب والمدربين والاباء المسجلين",
      english: "successful get all numbers",
    },
  });
};
// const getAllWalletsPdf = async (req, res) => {
//   const wallets = await Wallet.findAll({
//     where: {
//       isPaid: true,
//       typeEn: "deposit",
//     },
//     include: [{ model: Student }],
//   });

//   const invoicename = "invoice-" + 1 + ".pdf";
//   const invoicepath = path.join("invoices", invoicename);
//   res.setHeader("Content-type", "application/pdf");
//   res.setHeader("Content-Disposition", "inline;filename=" + invoicename + '"');
//   const pdfDoc = new PDFDocument();
//   pdfDoc.pipe(fs.createWriteStream(invoicepath));
//   pdfDoc.pipe(res);
//   wallets.forEach((wallet) => {
//     pdfDoc.text(
//       wallet.price + "," + wallet.currency + "," + wallet.Student.name
//     );
//   });
//   pdfDoc.end();
// };

const getAllWalletsPdf = async (req, res) => {
  const { language } = req.query;
  const wallets = await Wallet.findAll({
    where: {
      isPaid: true,
    },
    order: [["createdAt", "DESC"]],
    include: [{ model: Student }],
  });
  const financialRecords = await FinancialRecord.findAll({
    include: [
      { model: Student, attributes: ["name"], required: false },
      {
        model: Teacher,
        attributes: ["firstName", "lastName"],
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const htmlEN = `
  <html>
    <head>
      <style>
        table {
          width: 100%;
          border-collapse: collapse;
        }
        h1 {
          text-align: center;
        }
        th, td {
          border: 1px solid black;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #ddd;
        }
      </style>
    </head>
    <body>
      <h1>Wallets details</h1>
      <table>
        <thead>
          <tr>
            <th>Price</th>
            <th>Currency</th>
            <th>Student name</th>
            <th>Booking Pay</th>
          </tr>
        </thead>
        <tbody>
          ${wallets
            .map(
              (wallet) => `
            <tr>
              <td>${wallet.price}</td>
              <td>${wallet.currency}</td>
              <td>${wallet.Student?.name}</td>
              <td>${`${wallet.createdAt}`.substring(0, 24)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <h1>Payment Operations</h1>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Teacher</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Booking Pay</th>
          </tr>
        </thead>
        <tbody>
          ${financialRecords
            .map(
              (financialRecord) => `
            <tr>
              <td>${financialRecord.Student}</td>
              <td>${
                financialRecord.Teacher.firstName +
                " " +
                financialRecord.Teacher.lastName
              }</td>
              <td>${financialRecord.amount}</td>
              <td>${financialRecord.currency}</td>
              <td>${`${financialRecord.createdAt}`.substring(0, 24)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </body>
  </html>
`;

  const htmlAR = `
    <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          h1 {
            text-align: center;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #ddd;
          }
        </style>
      </head>
      <body>
     <h1>تفاصيل المحفظة</h1>
        <table>
          <thead>
            <tr>
            <th>تاريخ الحجز</th>
            <th>إسم الطالب</th>
            <th>العملة</th>
            <th>السعر</th>
            </tr>
          </thead>
          <tbody>
            ${wallets
              .map(
                (wallet) => `
              <tr>
              <td>${`${wallet.createdAt}`.substring(0, 24)}</td>
              <td>${wallet.Student?.name}</td>
              <td>${wallet.currency}</td>
              <td>${wallet.price}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <h1>عمليات الدفع</h1>
      <table>
        <thead>
          <tr>
            <th>الطالب</th>
            <th>المدرب</th>
            <th>المبلغ</th>
            <th>العملة</th>
            <th>تاريخ الدفع</th>
          </tr>
        </thead>
        <tbody>
          ${financialRecords
            .map(
              (financialRecord) => `
            <tr>
              <td>${financialRecord.Student}</td>
              <td>${
                financialRecord.Teacher.firstName +
                " " +
                financialRecord.Teacher.lastName
              }</td>
              <td>${financialRecord.amount}</td>
              <td>${financialRecord.currency}</td>
              <td>${`${financialRecord.createdAt}`.substring(0, 24)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      </body>
    </html>
  `;

  const options = {
    format: "A5",
    orientation: "landscape",
  };
  const html = language === "EN" ? htmlEN : htmlAR;
  pdf
    .create(html, options)
    .toFile(path.join("invoices", "wallets.pdf"), async (err, response) => {
      if (err) throw serverErrs.BAD_REQUEST("PDF not created");
      const pdf = await fetch(
        "https://server.moalime.com/modaribe/invoices/wallets.pdf"
      );
      const buffer = await pdf.arrayBuffer();
      const fileData = Buffer.from(buffer);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=wallets.pdf",
        "Content-Length": fileData.length,
      });
      res.end(fileData);
    });
};

const getAllStudentsPDF = async (req, res) => {
  const students = await Student.findAll({
    include: [
      { model: Level },
      { model: Class },
      { model: Curriculum },
      { model: Parent },
      { model: Session },
    ],
  });

  students.map((student) => {
    let c = 0;
    if (student.Sessions) {
      student.Sessions.forEach((Session) => {
        if (Session.isPaid) c++;
      });
    }
    student.sessionsCount = c;
    return student;
  });

  const html = `
    <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #ddd;
          }
        </style>
      </head>
      <body>
        <h1>All Students</h1>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Gender</th>
              <th>City</th>
              <th>Date of Birth</th>
              <th>Nationality</th>
              <th>Location</th>
              <th>Phone Number</th>
              <th>Level</th>
              <th>Class</th>
              <th>Curriculum</th>
              <th>Sessions</th>
            </tr>
          </thead>
          <tbody>
            ${students
              .map(
                (student) => `
              <tr>
                <td>${student.email}</td>
                <td>${student.name}</td>
                <td>${student.gender}</td>
                <td>${student.city}</td>
                <td>${student.dateOfBirth}</td>
                <td>${student.nationality}</td>
                <td>${student.location}</td>
                <td>${student.phoneNumber}</td>
                <td>${student.Level?.titleEN || "not exist"}</td>
                <td>${student.Class?.titleEN || "not exist"}</td>
                <td>${student.Curriculum?.titleEN || "not exist"}</td>
                <td>${student.sessionsCount}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const options = {
    format: "A2",
    orientation: "landscape",
  };
  try {
    pdf
      .create(html, options)
      .toFile(path.join("invoices", "students.pdf"), async (err, response) => {
        if (err) throw serverErrs.BAD_REQUEST("PDF not created");
        const pdf = await fetch(
          "https://server.moalime.com/modaribe/invoices/students.pdf"
        );
        const buffer = await pdf.arrayBuffer();
        const fileData = Buffer.from(buffer);
        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=students.pdf",
          "Content-Length": fileData.length,
        });
        res.end(fileData);
      });
  } catch (error) {
    res.send({
      message: "failed to save pdf",
      // status: 201,
      // response,
      // msg: {
      //   arabic: "تم ارجاع جميع الطلاب المسجلين",
      //   english: "successful get all students",
      // },
    });
  }
};

const getAllTeachersPDF = async (req, res) => {
  const teachers = await Teacher.findAll({
    include: { model: Session },
  });

  teachers.map((teacher) => {
    let c = 0;
    if (teacher.Sessions) {
      teacher.Sessions.forEach((Session) => {
        if (Session.isPaid) c++;
      });
    }
    teacher.sessionsCount = c;
    return teacher;
  });

  const html = `
    <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #ddd;
          }
        </style>
      </head>
      <body>
        <h1>All trainers</h1>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Gender</th>
              <th>City</th>
              <th>Date of Birth</th>
              <th>Phone Number</th>
              <th>Country</th>
              <th>Sessions</th>
            </tr>
          </thead>
          <tbody>
            ${teachers
              .map(
                (teacher) => `
              <tr>
                <td>${teacher.email}</td>
                <td>${teacher.firstName + " " + teacher.lastName}</td>
                <td>${teacher.gender}</td>
                <td>${teacher.city}</td>
                <td>${teacher.dateOfBirth}</td>
                <td>${teacher.phone}</td>
                <td>${teacher.country}</td>
                <td>${teacher.sessionsCount}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const options = {
    format: "A2",
    orientation: "landscape",
  };

  pdf
    .create(html, options)
    .toFile(path.join("invoices", "teachers.pdf"), async (err, response) => {
      if (err) throw serverErrs.BAD_REQUEST("PDF not created");
      const pdf = await fetch(
        "https://server.moalime.com/modaribe/invoices/teachers.pdf"
      );
      const buffer = await pdf.arrayBuffer();
      const fileData = Buffer.from(buffer);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=teachers.pdf",
        "Content-Length": fileData.length,
      });
      res.end(fileData);
    });
};
const getAllParentsPDF = async (req, res) => {
  const parents = await Parent.findAll({
    include: { model: Student },
  });

  const html = `
    <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #ddd;
          }
        </style>
      </head>
      <body>
        <h1>All Parents</h1>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Number of children</th>
            </tr>
          </thead>
          <tbody>
            ${parents
              .map(
                (parent) => `
              <tr>
                <td>${parent.email}</td>
                <td>${parent.name}</td>
                <td>${parent.Students?.length}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const options = {
    format: "A2",
    orientation: "landscape",
  };

  pdf
    .create(html, options)
    .toFile(path.join("invoices", "parents.pdf"), async (err, response) => {
      if (err) throw serverErrs.BAD_REQUEST("PDF not created");
      const pdf = await fetch(
        "https://server.moalime.com/modaribe/invoices/parents.pdf"
      );
      const buffer = await pdf.arrayBuffer();
      const fileData = Buffer.from(buffer);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=parents.pdf",
        "Content-Length": fileData.length,
      });
      res.end(fileData);
    });
};

const allReports = async (req, res) => {
  const parents = await Parent.findAll({
    include: { model: Student },
  });

  const teachers = await Teacher.findAll({
    include: { model: Session },
  });

  teachers.map((teacher) => {
    let c = 0;
    if (teacher.Sessions) {
      teacher.Sessions.forEach((Session) => {
        if (Session.isPaid) c++;
      });
    }
    teacher.sessionsCount = c;
    return teacher;
  });

  const students = await Student.findAll({
    include: [
      { model: Level },
      { model: Class },
      { model: Curriculum },
      { model: Parent },
      { model: Session },
    ],
  });

  students.map((student) => {
    let c = 0;
    if (student.Sessions) {
      student.Sessions.forEach((Session) => {
        if (Session.isPaid) c++;
      });
    }
    student.sessionsCount = c;
    return student;
  });

  const html1 = `
    <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #ddd;
          }
        </style>
      </head>
      <body>
        <h1>All Parents</h1>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Number of children</th>
            </tr>
          </thead>
          <tbody>
            ${parents
              .map(
                (parent) => `
              <tr>
                <td>${parent.email}</td>
                <td>${parent.name}</td>
                <td>${parent.Students?.length}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const html2 = `
    <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #ddd;
          }
        </style>
      </head>
      <body>
        <h1>All trainers</h1>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Gender</th>
              <th>City</th>
              <th>Date of Birth</th>
              <th>Phone Number</th>
              <th>Country</th>
              <th>Sessions</th>
            </tr>
          </thead>
          <tbody>
            ${teachers
              .map(
                (teacher) => `
              <tr>
                <td>${teacher.email}</td>
                <td>${teacher.firstName + " " + teacher.lastName}</td>
                <td>${teacher.gender}</td>
                <td>${teacher.city}</td>
                <td>${teacher.dateOfBirth}</td>
                <td>${teacher.phone}</td>
                <td>${teacher.country}</td>
                <td>${teacher.sessionsCount}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const html3 = `
    <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #ddd;
          }
        </style>
      </head>
      <body>
        <h1>All Students</h1>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Gender</th>
              <th>City</th>
              <th>Date of Birth</th>
              <th>Nationality</th>
              <th>Location</th>
              <th>Phone Number</th>
              <th>Level</th>
              <th>Class</th>
              <th>Curriculum</th>
              <th>Sessions</th>
            </tr>
          </thead>
          <tbody>
            ${students
              .map(
                (student) => `
              <tr>
                <td>${student.email}</td>
                <td>${student.name}</td>
                <td>${student.gender}</td>
                <td>${student.city}</td>
                <td>${student.dateOfBirth}</td>
                <td>${student.nationality}</td>
                <td>${student.location}</td>
                <td>${student.phoneNumber}</td>
                <td>${student.Level?.titleEN || "not exist"}</td>
                <td>${student.Class?.titleEN || "not exist"}</td>
                <td>${student.Curriculum?.titleEN || "not exist"}</td>
                <td>${student.sessionsCount}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const options = {
    format: "A2",
    orientation: "landscape",
  };

  pdf
    .create(html1, options)
    .toFile(path.join("invoices", "parents.pdf"), async (err, response) => {
      if (err) throw serverErrs.BAD_REQUEST("PDF not created");
    });
  pdf
    .create(html2, options)
    .toFile(path.join("invoices", "teachers.pdf"), async (err, response) => {
      if (err) throw serverErrs.BAD_REQUEST("PDF not created");
    });
  pdf
    .create(html3, options)
    .toFile(path.join("invoices", "students.pdf"), async (err, response) => {
      if (err) throw serverErrs.BAD_REQUEST("PDF not created");
    });

  const readFileAsync = promisify(fs.readFile);
  const buffer1 = await readFileAsync(path.join("invoices", "teachers.pdf"));
  const buffer2 = await readFileAsync(path.join("invoices", "students.pdf"));
  const buffer3 = await readFileAsync(path.join("invoices", "parents.pdf"));

  const pdfDoc = await PDFDocument.create();

  const [pdf1Doc, pdf2Doc, pdf3Doc] = await Promise.all([
    PDFDocument.load(buffer1),
    PDFDocument.load(buffer2),
    PDFDocument.load(buffer3),
  ]);

  // copy pages from each generated PDF file into new PDF document
  const [pdf1Pages, pdf2Pages, pdf3Pages] = await Promise.all([
    pdfDoc.copyPages(pdf1Doc, pdf1Doc.getPageIndices()),
    pdfDoc.copyPages(pdf2Doc, pdf2Doc.getPageIndices()),
    pdfDoc.copyPages(pdf3Doc, pdf3Doc.getPageIndices()),
  ]);

  // add copied pages to new PDF document
  pdf1Pages.forEach((page) => pdfDoc.addPage(page));
  pdf2Pages.forEach((page) => pdfDoc.addPage(page));
  pdf3Pages.forEach((page) => pdfDoc.addPage(page));

  // save final combined PDF file
  const mergedPdf = await pdfDoc.save();
  fs.writeFileSync(path.join("invoices", "combined.pdf"), mergedPdf);
  const pdf4 = await fetch(
    "https://server.moalime.com/modaribe/invoices/combined.pdf"
  );
  const buffer = await pdf4.arrayBuffer();
  const fileData = Buffer.from(buffer);
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment; filename=parents.pdf",
    "Content-Length": fileData.length,
  });
  res.end(fileData);
};

const getSessionsForStudent = async (req, res) => {
  const { StudentId } = req.params;
  const sessions = await Session.findAll({
    where: {
      StudentId,
      isPaid: true,
    },
    include: [{ model: Teacher }],
  });
  res.send({
    status: 200,
    sessions,
    msg: {
      arabic: "تم ارجاع جميع الجلسات للطالب بنجاح",
      english: "successful get all sessions for the student successfully",
    },
  });
};

const getSessionsForTeacher = async (req, res) => {
  const { TeacherId } = req.params;
  const sessions = await Session.findAll({
    where: {
      TeacherId,
      isPaid: true,
    },
    include: [{ model: Student }],
  });
  res.send({
    status: 200,
    sessions,
    msg: {
      arabic: "تم ارجاع جميع الجلسات للمعلم بنجاح",
      english: "successful get all sessions for the teacher successfully",
    },
  });
};

const editWhatsappPhone = async (req, res) => {
  const id = req.user.userId;
  const { whatsappPhone } = req.body;
  const admin = await Admin.findOne({
    where: { id },
  });
  if (!admin) {
    throw serverErrs.BAD_REQUEST("Admin not found");
  }
  await admin.update({ whatsappPhone });
  res.send({
    status: 201,
    admin,
    msg: {
      arabic: "تم تحديث رقم الواتس بنجاح",
      english: "successful update whatsapp phone successfully",
    },
  });
};

const createSocialMedia = async (req, res) => {
  const { type, link } = req.body;
  const newSocialMedia = await SocialMedia.create(
    {
      type,
      link,
    },
    {
      returning: true,
    }
  );
  await newSocialMedia.save();
  res.send({
    status: 201,
    data: newSocialMedia,
    msg: {
      arabic: "تم إضافة رابط السوشيال ميديا بنجاح",
      english: "successful create new SocialMedia",
    },
  });
};

const editSocialMedia = async (req, res) => {
  const { SocialMediaId } = req.params;
  const { type, link } = req.body;
  const socialMedia = await SocialMedia.findOne({
    where: { id: SocialMediaId },
  });
  if (!socialMedia) {
    throw serverErrs.BAD_REQUEST("socialMedia not found");
  }
  await socialMedia.update({ type, link });
  res.send({
    status: 201,
    data: socialMedia,
    msg: {
      arabic: "تم تحديث رابط السوشيال ميديا بنجاح",
      english: "successful update new SocialMedia",
    },
  });
};

const getSocialMedia = async (req, res) => {
  const socialMedia = await SocialMedia.findAll();
  res.send({
    status: 200,
    data: socialMedia,
    msg: {
      arabic: "تم ارجاع السوشيال ميديا بنجاح",
      english: "successful get SocialMedia",
    },
  });
};

const getWatsappPhone = async (req, res) => {
  const admin = await Admin.findOne({ where: { id: 1 } });
  res.send({
    status: 200,
    data: admin.whatsappPhone,
    msg: {
      arabic: "تم ارجاع رقم الواتس بنجاح",
      english: "successful get whatsapp phone",
    },
  });
};
const updateProfitRatio = async (req, res) => {
  const { profitRatio } = req.body;
  await profitValidation.validate({ profitRatio });
  const id = req.user.userId;

  const admin = await Admin.findOne({
    where: {
      id: id,
    },
  });
  admin.profitRatio = profitRatio;
  await admin.save();
  res.send({
    status: 201,
    msg: {
      arabic: "تم تحديث نسبة الربح بنجاح",
      english: "successful update profitRatio successfully",
    },
  });
};

const deleteTeacher = async (req, res) => {
  const { TeacherId } = req.params;
  const teacher = await Teacher.findOne({ where: { id: TeacherId } });
  if (!teacher) throw serverErrs.BAD_REQUEST("Teacher not found");
  await teacher.update({ isEnable: false });
  res.send({
    status: 201,
    msg: {
      arabic: "تم حذف المدرب بنجاح",
      english: "successful delete trainer",
    },
  });
};

const deleteStudent = async (req, res) => {
  const { StudentId } = req.params;
  const student = await Student.findOne({ where: { id: StudentId } });
  if (!student) throw serverErrs.BAD_REQUEST("Student not found");
  await student.update({ isEnable: false });
  res.send({
    status: 201,
    msg: {
      arabic: "تم حذف الطالب بنجاح",
      english: "successful delete Student",
    },
  });
};

const getProfitRatio = async (req, res) => {
  const admin = await Admin.findOne({ where: { id: req.user.userId } });
  res.send({
    status: 200,
    profitRatio: admin.profitRatio,
  });
};

// Added by Abdelwahab

const signAbout = async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await Teacher.findOne({ where: { id: teacherId } });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  const { firstName, lastName, gender, dateOfBirth, phone, country, city } =
    req.body;
  let { languages } = req.body;
  if (typeof languages === "string") {
    languages = JSON.parse(languages);
  }
  await teacher.update({
    firstName,
    lastName,
    gender,
    dateOfBirth,
    phone,
    country,
    city,
  });
  const langTeacher = await LangTeachStd.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });

  await LangTeachStd.bulkCreate(languages).then(() =>
    console.log("LangTeachStd data have been created")
  );

  const langTeachers = await LangTeachStd.findAll({
    where: {
      TeacherId: teacher.id,
    },
    include: { all: true },
  });
  await teacher.save();
  const firstNames = teacher.firstName;
  const lastNames = teacher.lastName;

  res.send({
    status: 201,
    data: { firstName: firstNames, lastName: lastNames },
    msg: {
      arabic: "تم تسجيل معلوماتك بنجاح",
      english: "successful sign about data",
    },
  });
};

const uploadImage = async (req, res) => {
  const { teacherId } = req.params;

  if (!req.file)
    throw serverErrs.BAD_REQUEST({
      arabic: " الصورة غير موجودة ",
      english: "Image not exist ",
    });

  const teacher = await Teacher.findOne({ where: { id: teacherId } });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  const clearImage = (filePath) => {
    filePath = path.join(__dirname, "..", `images/${filePath}`);
    fs.unlink(filePath, (err) => {
      if (err) throw serverErrs.BAD_REQUEST("Image not found");
    });
  };

  if (teacher.image) {
    clearImage(teacher.image);
  }
  await teacher.update({ image: req.file.filename });
  res.send({
    status: 201,
    data: req.file.filename,
    msg: {
      arabic: "تم إدراج الصورة بنجاح",
      english: "uploaded image successfully",
    },
  });
};

const signAdditionalInfo = async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await Teacher.findOne({
    where: { id: teacherId },
    attributes: { exclude: ["password"] },
  });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  const {
    haveCertificates,
    haveExperience,
    experienceYears,
    favStdGender,
    favHours,
    articleExperience,
    bank_name,
    acc_name,
    acc_number,
    iban,
    paypal_acc,
  } = req.body;

  let { levels, curriculums } = req.body;
  if (typeof levels === "string") {
    levels = JSON.parse(levels);
  }
  if (typeof curriculums === "string") {
    curriculums = JSON.parse(curriculums);
  }

  await teacher.update({
    haveCertificates,
    haveExperience,
    experienceYears,
    favStdGender,
    favHours,
    articleExperience,
    bank_name,
    acc_name,
    acc_number,
    iban,
    paypal_acc,
  });
  const curriculumTeacher = await CurriculumTeacher.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });

  const teacherLevel = await TeacherLevel.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });

  await TeacherLevel.bulkCreate(levels).then(() =>
    console.log("LangTeachStd data have been created")
  );
  await CurriculumTeacher.bulkCreate(curriculums).then(() =>
    console.log("LangTeachStd data have been created")
  );

  const teacherLevels = await TeacherLevel.findAll({
    where: {
      TeacherId: teacher.id,
    },
    include: { all: true },
  });

  const curriculumTeachers = await CurriculumTeacher.findAll({
    where: {
      TeacherId: teacher.id,
    },
    include: { all: true },
  });
  await teacher.save();

  res.send({
    status: 201,
    data: { teacher, teacherLevels, curriculumTeachers },
    msg: {
      arabic: "تم تسجيل معلومات إضافية بنجاح",
      english: "successful sign Additional Information! ",
    },
  });
};

const addSubjects = async (req, res) => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findOne({ where: { id: teacherId } });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  let { remote, f2fStudent, f2fTeacher, subjects } = req.body;

  if (typeof subjects === "string") {
    subjects = JSON.parse(subjects);
  }
  if (typeof remote === "string") {
    remote = JSON.parse(remote);
  }
  if (typeof f2fStudent === "string") {
    f2fStudent = JSON.parse(f2fStudent);
  }
  if (typeof f2fTeacher === "string") {
    f2fTeacher = JSON.parse(f2fTeacher);
  }

  await TeacherSubject.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });

  await RemoteSession.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });
  await F2FSessionStd.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });
  await F2FSessionTeacher.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });
  await TeacherSubject.bulkCreate(subjects).then(() =>
    console.log("Teacher Subjects data have been created")
  );
  if (remote) {
    remote["priceAfterDiscount"] =
      +remote.price - +remote.price * (+remote.discount / 100.0);
    await RemoteSession.create(remote).then(() =>
      console.log("Teacher remote session has been saved")
    );
  }
  if (f2fStudent) {
    f2fStudent["priceAfterDiscount"] =
      +f2fStudent.price - +f2fStudent.price * (+f2fStudent.discount / 100.0);
    await F2FSessionStd.create(f2fStudent).then(() =>
      console.log("teacher session at home student has been saved")
    );
  }
  if (f2fTeacher) {
    f2fTeacher["priceAfterDiscount"] =
      +f2fTeacher.price - +f2fTeacher.price * (+f2fTeacher.discount / 100.0);
    await F2FSessionTeacher.create(f2fTeacher).then(() =>
      console.log("Teacher session at teacher home has been saved")
    );
  }

  const teacherSubjects = await TeacherSubject.findAll({
    where: {
      TeacherId: teacherId,
    },
    include: {
      all: true,
    },
  });

  const remoteSession = await RemoteSession.findAll({
    where: {
      TeacherId: teacherId,
    },
    include: {
      all: true,
    },
  });

  const f2fStudentSession = await F2FSessionStd.findAll({
    where: {
      TeacherId: teacherId,
    },
    include: {
      all: true,
    },
  });

  const f2fTeacherSession = await F2FSessionTeacher.findAll({
    where: {
      TeacherId: teacherId,
    },
    include: {
      all: true,
    },
  });
  res.send({
    status: 201,
    data: {
      teacherSubjects,
      remoteSession,
      f2fStudentSession,
      f2fTeacherSession,
    },
    msg: {
      arabic: "تم إضافة مادة ونوع الجلسة بنجاح",
      english: "added subjects and session type successfully",
    },
  });
};

const signResume = async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await Teacher.findOne({ where: { id: teacherId } });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  let { certificates, experiences, educationDegrees } = req.body;

  if (typeof certificates === "string") {
    certificates = JSON.parse(certificates);
  }
  if (typeof experiences === "string") {
    experiences = JSON.parse(experiences);
  }
  if (typeof educationDegrees === "string") {
    educationDegrees = JSON.parse(educationDegrees);
  }

  const teacherCertificate = await Certificates.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });

  const teacherExperience = await Experience.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });

  const teacherEducationDegree = await EducationDegree.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });

  await Certificates.bulkCreate(certificates).then(() =>
    console.log("Certificates data have been created")
  );
  await Experience.bulkCreate(experiences).then(() =>
    console.log("Experience data have been created")
  );
  await EducationDegree.bulkCreate(educationDegrees).then(() =>
    console.log("EducationDegree data have been created")
  );

  const teacherCertificates = await Certificates.findAll({
    where: {
      TeacherId: teacher.id,
    },
    include: { all: true },
  });

  const teacherExperiences = await Experience.findAll({
    where: {
      TeacherId: teacher.id,
    },
    include: { all: true },
  });

  const teacherEducationDegrees = await EducationDegree.findAll({
    where: {
      TeacherId: teacher.id,
    },
    include: { all: true },
  });
  await teacher.save();
  res.send({
    status: 201,
    data: { teacherCertificates, teacherExperiences, teacherEducationDegrees },
    msg: {
      arabic: "تم إدخال معلومات السيرة الذاتية بنجاح",
      english: "successful sign Resume Information!",
    },
  });
};
const signAvailability = async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await Teacher.findOne({
    where: { id: teacherId },
    attributes: { exclude: ["password"] },
  });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  const { timeZone } = req.body;
  let { teacherDayes } = req.body;

  if (typeof teacherDayes === "string") {
    teacherDayes = JSON.parse(teacherDayes);
  }

  await teacher.update({
    timeZone,
  });
  const teacherDay = await TeacherDay.destroy({
    where: {
      TeacherId: teacher.id,
    },
  });

  await TeacherDay.bulkCreate(teacherDayes).then(() =>
    console.log("TeacherDay data have been created")
  );

  const dayesTeacher = await TeacherDay.findAll({
    where: {
      TeacherId: teacher.id,
    },
    include: { all: true },
    attributes: { exclude: ["password"] },
  });

  await teacher.save();
  res.send({
    status: 201,
    data: { teacher, dayesTeacher },
    msg: {
      arabic: "تم تسجيل الوقت المتاح بنجاح",
      english: "successful sign availability!",
    },
  });
};

const addDescription = async (req, res) => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findOne({
    where: { id: teacherId },
    attributes: { exclude: ["password"] },
  });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });
  const { shortHeadlineAr, shortHeadlineEn, descriptionAr, descriptionEn } =
    req.body;

  const updatedTeacher = await teacher.update({
    shortHeadlineAr,
    shortHeadlineEn,
    descriptionAr,
    descriptionEn,
  });
  res.send({
    status: 201,
    data: updatedTeacher,
    msg: {
      arabic: "تم إضافة وصف بنجاح",
      english: "added description successfully",
    },
  });
};

const signVideoLink = async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await Teacher.findOne({
    where: { id: teacherId },
    attributes: { exclude: ["password"] },
  });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  const { videoLink } = req.body;

  await teacher.update({
    videoLink,
  });

  await teacher.save();
  res.send({
    status: 201,
    data: teacher,
    msg: {
      arabic: "تم إدراج الفيديو بنجاح",
      english: "successful sign VideoLink Information!",
    },
  });
};

// ----------------------
const deleteLevel = async (req, res) => {
  const { levelId } = req.params;
  const level = await Level.findOne({
    where: { id: levelId },
  });
  if (!level)
    throw serverErrs.BAD_REQUEST({
      arabic: "المستوى غير موجود",
      english: "Invalid levelId! ",
    });
  const classes = await Class.findAll({
    where: {
      LevelId: levelId,
    },
  });
  classes.forEach(async (classItem) => {
    await classItem.destroy();
  });

  const curriculumLevels = await CurriculumLevel.findAll({
    where: {
      LevelId: levelId,
    },
  });
  curriculumLevels.forEach(async (curriculumLevel) => {
    await curriculumLevel.destroy();
  });
  const teacherLevels = await TeacherLevel.findAll({
    where: {
      LevelId: levelId,
    },
  });
  teacherLevels.forEach(async (teacherLevel) => {
    await teacherLevel.destroy();
  });
  await level.destroy();
  res.send({
    status: 201,
    msg: {
      arabic: "تم حذف المستوى بنجاح",
      english: "successfully delete level!",
    },
  });
};

const deleteClass = async (req, res) => {
  const { classId } = req.params;
  const clss = await Class.findOne({
    where: { id: classId },
  });
  if (!clss)
    throw serverErrs.BAD_REQUEST({
      arabic: "الصف غير موجود",
      english: "Invalid classId! ",
    });
  await clss.destroy();

  res.send({
    status: 201,
    msg: {
      arabic: "تم حذف القسم بنجاح",
      english: "successfully delete class!",
    },
  });
};
const deleteCurriculum = async (req, res) => {
  const { curriculumId } = req.params;
  console.log("trying to delete curruculum with id = ", curriculumId);
  const curriculum = await Curriculum.findOne({
    where: { id: curriculumId },
  });
  if (!curriculum)
    throw serverErrs.BAD_REQUEST({
      arabic: "المنهج غير موجود",
      english: "Invalid curriculumId! ",
    });
  const curriculumLevels = await CurriculumLevel.findAll({
    where: {
      CurriculumId: curriculumId,
    },
  });
  curriculumLevels.forEach(async (curriculumLevel) => {
    await curriculumLevel.destroy();
  });
  const curriculumTeachers = await CurriculumTeacher.findAll({
    where: {
      CurriculumId: curriculumId,
    },
  });
  curriculumTeachers.forEach(async (curriculumTeacher) => {
    await curriculumTeacher.destroy();
  });
  await curriculum.destroy();
  res.send({
    status: 201,
    msg: {
      arabic: "تم حذف المنهج بنجاح",
      english: "successfully delete curriculum!",
    },
  });
};

const deleteSubjectCategory = async (req, res) => {
  const { categoryId } = req.params;
  console.log("trying to delete subjectCategory with id = ", categoryId);
  const subjectCategorie = await SubjectCategory.findOne({
    where: { id: categoryId },
  });
  if (!subjectCategorie)
    throw serverErrs.BAD_REQUEST({
      arabic: "التصنيف غير موجود",
      english: "Invalid categoryId! ",
    });
  const subjects = await Subject.findAll({
    where: {
      SubjectCategoryId: categoryId,
    },
  });

  subjects.forEach(async (sub) => {
    await sub.destroy();
  });
  await subjectCategorie.destroy();

  res.send({
    status: 201,
    msg: {
      arabic: "تم حذف المادة بنجاح",
      english: "successfully delete category!",
    },
  });
};
const deleteSubject = async (req, res) => {
  const { subjectId } = req.params;
  console.log("trying to delete subject with id = ", subjectId);
  const subject = await Subject.findOne({
    where: { id: subjectId },
  });
  if (!subject)
    throw serverErrs.BAD_REQUEST({
      arabic: "الموضوع غير موجود",
      english: "Invalid subjectId! ",
    });
  const teacherSubjects = await TeacherSubject.findAll({
    where: {
      SubjectId: subjectId,
    },
  });
  teacherSubjects.forEach(async (teacherSubject) => {
    await teacherSubject.destroy();
  });
  await subject.destroy();

  res.send({
    status: 201,
    msg: {
      arabic: "تم حذف الموضوع بنجاح",
      english: "successfully delete subject!",
    },
  });
};

const suspendTeacher = async (req, res) => {
  const { teacherId } = req.params;
  console.log("trying to suspend teacher with id = ", teacherId);
  const teacher = await Teacher.findOne({
    where: { id: teacherId },
  });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });
  await teacher.update({
    isSuspended: true,
  });
  const mailOptions = {
    from: "info@modaribe.com",
    to: teacher.email,
    subject: "modaribe: Account Suspended",
    html: `<div style="text-align: right;"> مرحبًا ، <br> 
    <br>.يؤسفنا أن نحيطك علما أن مدير موقع مدربي قام بتوقيف حسابك توقيفا مؤقتا
    <br>.الرجاء التواصل مع الإدارة لحل المشكلة في القريب العاجل
    <br>.في الأثناء لا يمكنك استخدام خدمات موقع مدربي
    .حظًا سعيدًا <br>
    ,فريق مدربي
    </div>`,
  };
  const smsOptions = {
    body: `مرحبًا ،
    .يؤسفنا أن نحيطك علما أن مدير موقع مدربي قام بتوقيف حسابك توقيفا مؤقتا
    .الرجاء التواصل مع الإدارة لحل المشكلة في القريب العاجل
    .في الأثناء لا يمكنك استخدام خدمات موقع مدربي
    .حظًا سعيدًا 
    ,فريق مدربي`,
    to: teacher.phone,
  };
  sendEmail(mailOptions, smsOptions);
  res.send({
    status: 201,
    msg: {
      arabic: "تم ايقاف المدرب بنجاح",
      english: "successfully suspended trainer!",
    },
  });
};
const suspendStudent = async (req, res) => {
  const { studentId } = req.params;
  console.log("trying to suspend student with id = ", studentId);
  const student = await Student.findOne({
    where: { id: studentId },
  });
  if (!student)
    throw serverErrs.BAD_REQUEST({
      arabic: "الطالب غير موجود",
      english: "Invalid studentId! ",
    });
  await student.update({
    isSuspended: true,
  });
  const mailOptions = {
    from: "info@modaribe.com",
    to: student.email,
    subject: "modaribe: Account Suspended",
    html: `<div style="text-align: right;"> مرحبًا ، <br> 
    <br>.يؤسفنا أن نحيطك علما أن مدير موقع مدربي قام بتوقيف حسابك توقيفا مؤقتا
    <br>.الرجاء التواصل مع الإدارة لحل المشكلة في القريب العاجل
    <br>.في الأثناء لا يمكنك استخدام خدمات موقع مدربي
    .حظًا سعيدًا <br>
    ,فريق مدربي
    </div>`,
  };
  const smsOptions = {
    body: `مرحبًا ،
    .يؤسفنا أن نحيطك علما أن مدير موقع مدربي قام بتوقيف حسابك توقيفا مؤقتا
    .الرجاء التواصل مع الإدارة لحل المشكلة في القريب العاجل
    .في الأثناء لا يمكنك استخدام خدمات موقع مدربي
    .حظًا سعيدًا 
    ,فريق مدربي`,
    to: student.phoneNumber,
  };
  sendEmail(mailOptions, smsOptions);

  res.send({
    status: 201,
    msg: {
      arabic: "تم ايقاف الطالب بنجاح",
      english: "successfully suspended student!",
    },
  });
};
const unSuspendTeacher = async (req, res) => {
  const { teacherId } = req.params;
  console.log("trying to unSuspend teacher with id = ", teacherId);
  const teacher = await Teacher.findOne({
    where: { id: teacherId },
  });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });
  await teacher.update({
    isSuspended: false,
  });

  const mailOptions = {
    from: "info@modaribe.com",
    to: teacher.email,
    subject: "modaribe: Account Activated",
    html: `<div style="text-align: right;"> مرحبًا ، <br> 
    <br>.يسعدنا أن نحيطك علما أن مدير موقع مدربي قام بإعادة تفعيل حسابك 
    <br> يمكنك استخدام خدمات موقع مدربي الآن
    <br>.مع كامل إعتذارات فريق موقعي
    .حظًا سعيدًا <br>
    ,فريق مدربي
    </div>`,
  };
  const smsOptions = {
    body: `مرحبًا ،
    .يسعدنا أن نحيطك علما أن مدير موقع مدربي قام بإعادة تفعيل حسابك 
    .يمكنك استخدام خدمات موقع مدربي الآن
   .مع كامل إعتذارات فريق موقعي
    .حظًا سعيدًا 
    ,فريق مدربي`,
    to: teacher.phone,
  };
  sendEmail(mailOptions, smsOptions);

  res.send({
    status: 201,
    msg: {
      arabic: "تم اعادة تفعيل المدرب بنجاح",
      english: "successfully unSuspended trainer!",
    },
  });
};
const unSuspendStudent = async (req, res) => {
  const { studentId } = req.params;
  console.log("trying to unSuspend student with id = ", studentId);
  const student = await Student.findOne({
    where: { id: studentId },
  });
  if (!student)
    throw serverErrs.BAD_REQUEST({
      arabic: "الطالب غير موجود",
      english: "Invalid studentId! ",
    });
  await student.update({
    isSuspended: false,
  });
  const mailOptions = {
    from: "info@modaribe.com",
    to: student.email,
    subject: "modaribe: Account Activated",
    html: `<div style="text-align: right;"> مرحبًا ، <br> 
    <br>.يسعدنا أن نحيطك علما أن مدير موقع مدربي قام بإعادة تفعيل حسابك 
    <br> يمكنك استخدام خدمات موقع مدربي الآن
    <br>.مع كامل إعتذارات فريق موقعي
    .حظًا سعيدًا <br>
    ,فريق مدربي
    </div>`,
  };
  const smsOptions = {
    body: `مرحبًا ،
    .يسعدنا أن نحيطك علما أن مدير موقع مدربي قام بإعادة تفعيل حسابك 
    .يمكنك استخدام خدمات موقع مدربي الآن
   .مع كامل إعتذارات فريق موقعي
    .حظًا سعيدًا 
    ,فريق مدربي`,
    to: student.phoneNumber,
  };
  sendEmail(mailOptions, smsOptions);
  res.send({
    status: 201,
    msg: {
      arabic: "تم اعادة تفعيل الطالب بنجاح",
      english: "successfully unSuspended student!",
    },
  });
};
const suspendParent = async (req, res) => {
  const { parentId } = req.params;
  console.log("trying to suspend parent with id = ", parentId);
  const parent = await Parent.findOne({
    where: { id: parentId },
  });
  if (!parent)
    throw serverErrs.BAD_REQUEST({
      arabic: "الوالد غير موجودة",
      english: "Invalid parentId! ",
    });
  await parent.update({
    isSuspended: true,
  });

  const mailOptions = {
    from: "info@modaribe.com",
    to: parent.email,
    subject: "modaribe: Account Suspended",
    html: `<div style="text-align: right;"> مرحبًا ، <br> 
    <br>.يؤسفنا أن نحيطك علما أن مدير موقع مدربي قام بتوقيف حسابك توقيفا مؤقتا
    <br>.الرجاء التواصل مع الإدارة لحل المشكلة في القريب العاجل
    <br>.في الأثناء لا يمكنك استخدام خدمات موقع مدربي
    .حظًا سعيدًا <br>
    ,فريق مدربي
    </div>`,
  };
  sendEmail(mailOptions);

  res.send({
    status: 201,
    msg: {
      arabic: "تم ايقاف الوالد بنجاح",
      english: "successfully suspended parent!",
    },
  });
};
const unSuspendParent = async (req, res) => {
  const { parentId } = req.params;
  console.log("trying to unSuspend parent with id = ", parentId);
  const parent = await Parent.findOne({
    where: { id: parentId },
  });
  if (!parent)
    throw serverErrs.BAD_REQUEST({
      arabic: "الوالد غير موجودة",
      english: "Invalid parentId! ",
    });
  await parent.update({
    isSuspended: false,
  });
  const mailOptions = {
    from: "info@modaribe.com",
    to: parent.email,
    subject: "modaribe: Account Activated",
    html: `<div style="text-align: right;"> مرحبًا ، <br> 
    <br>.يسعدنا أن نحيطك علما أن مدير موقع مدربي قام بإعادة تفعيل حسابك 
    <br> يمكنك استخدام خدمات موقع مدربي الآن
    <br>.مع كامل إعتذارات فريق مدربي
    .حظًا سعيدًا <br>
    ,فريق مدربي
    </div>`,
  };
  sendEmail(mailOptions);
  res.send({
    status: 201,
    msg: {
      arabic: "تم  اعادة تفعيل الوالد بنجاح",
      english: "successfully unsuspended parent!",
    },
  });
};

const getAllFinancialRecords = async (req, res) => {
  const financialRecords = await FinancialRecord.findAll({
    include: [
      { model: Student, attributes: ["name"], required: false },
      {
        model: Teacher,
        attributes: ["firstName", "lastName"],
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });
  res.send({
    status: 200,
    data: financialRecords,
    msg: {
      arabic: "تم جلب التقارير المالية بنجاح",
      english: "successfully fetched financial records!",
    },
  });
};

module.exports = {
  signUp,
  login,
  createStudent,
  createTeacher,
  createSubjectCategory,
  createSubject,
  createLevel,
  createClass,
  createCurriculum,
  getSubjects,
  getSingleSubject,
  getSubjectCategories,
  getSingleSubjectCategory,
  getClasses,
  getSingleClass,
  getLevels,
  getSingleLevel,
  getCurriculums,
  getSingleCurriculum,
  linkedCurriculumLevel,
  acceptStudent,
  rejectStudent,
  getParentStudentWaiting,
  getParentStudentAccOrRej,
  acceptTeacher,
  getAcceptedTeachers,
  rejectTeacher,
  getWaitingTeacher,
  getLanguageLevel,
  updateLevel,
  updateSubCategories,
  updateSubject,
  updateClass,
  updateCurriculum,
  payDues,
  getAllSessions,
  getAllWallets,
  getStudentWallets,
  getThawaniSession,
  getAllTeachers,
  getTeacherFinancial,
  getNumbers,
  getAllWalletsPdf,
  getAllStudentsPDF,
  getAllTeachersPDF,
  getAllParentsPDF,
  getSessionsForStudent,
  getSessionsForTeacher,
  editWhatsappPhone,
  createSocialMedia,
  editSocialMedia,
  getSocialMedia,
  getWatsappPhone,
  allReports,
  updateProfitRatio,
  deleteTeacher,
  deleteStudent,
  getProfitRatio,
  getNewCheckoutRequests,
  getProcessedCheckoutRequests,
  acceptCheckout,
  rejectCheckout,
  signAbout,
  uploadImage,
  signAdditionalInfo,
  addSubjects,
  signResume,
  signAvailability,
  addDescription,
  signVideoLink,
  deleteLevel,
  deleteClass,
  deleteCurriculum,
  deleteSubjectCategory,
  deleteSubject,
  suspendTeacher,
  suspendStudent,
  suspendParent,
  unSuspendTeacher,
  unSuspendStudent,
  unSuspendParent,
  getAllFinancialRecords,
};
