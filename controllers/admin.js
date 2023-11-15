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
} = require("../models");
const { PDFDocument } = require("pdf-lib");
const path = require("path");
const fs = require("fs");
const pdf = require("html-pdf");

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
      arabic: "المعلم غير موجود",
      english: "invalid teacherId!",
    });

  await teacher.update({ isVerified: true });

  res.send({
    status: 201,
    data: teacher,
    msg: {
      arabic: "تم قبول المعلم بنجاح",
      english: "teacher has been accepted",
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
      arabic: "تم ارجاع جميع المعلمين المقبولين",
      english: "successful get all acceptedTeachers",
    },
  });
};

const rejectTeacher = async (req, res) => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findOne({ where: { id: teacherId } });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المعلم غير موجود",
      english: "Invalid teacherId! ",
    });
  await Teacher.destroy({
    where: {
      id: teacherId,
    },
  });

  res.send({
    status: 201,
    msg: { arabic: "تم رفض المعلم", english: "Rejected teacher successfully" },
  });
};

const getWaitingTeacher = async (req, res) => {
  const teachers = await Teacher.findAll({
    where: {
      isVerified: false,
    },
  });
  res.send({
    status: 201,
    data: teachers,
    msg: {
      arabic: "تم ارجاع جميع المعلمين غير المقبولين بعد",
      english: "successful get all waiting teachers",
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
      arabic: "تم ارجاع جميع المعلمين",
      english: "successful get all teachers",
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
      arabic: "تم ارجاع جميع الطلاب والمعلمين والاباء المسجلين",
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
    include: [{ model: Student }],
    limit: 20000,
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
        "https://server.moalime.com/invoices/wallets.pdf"
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
          "https://server.moalime.com/invoices/students.pdf"
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
        <h1>All Teachers</h1>
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
        "https://server.moalime.com/invoices/teachers.pdf"
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
        "https://server.moalime.com/invoices/parents.pdf"
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
        <h1>All Teachers</h1>
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
  const pdf4 = await fetch("https://server.moalime.com/invoices/combined.pdf");
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
      arabic: "تم حذف المعلم بنجاح",
      english: "successful delete teacher",
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

module.exports = {
  signUp,
  login,
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
};
