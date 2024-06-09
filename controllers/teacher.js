const {
  Teacher,
  Student,
  Parent,
  LangTeachStd,
  TeacherLevel,
  CurriculumTeacher,
  RemoteSession,
  F2FSessionStd,
  F2FSessionTeacher,
  TeacherDay,
  Certificates,
  Experience,
  EducationDegree,
  Language,
  Days,
  Level,
  Curriculum,
  Subject,
  Session,
  FinancialRecord,
  Rate,
  CheckoutRequest,
  Admin,
} = require("../models");
const { validateTeacher, loginValidation } = require("../validation");
const { serverErrs } = require("../middlewares/customError");
const generateRandomCode = require("../middlewares/generateCode");
const sendEmail = require("../middlewares/sendEmail");
const { compare, hash } = require("bcrypt");
const generateToken = require("../middlewares/generateToken");
const path = require("path");
const fs = require("fs");
const TeacherSubject = require("../models/TeacherSubject");
const { Op } = require("sequelize");
const { db } = require("../firebaseConfig");
const CC = require("currency-converter-lt");
const dotenv = require("dotenv");
const {
  generateConfirmEmailBody,
  generateWelcomeEmailBody,
} = require("../utils/EmailBodyGenerator");
const {
  generateConfirmEmailSMSBody,
  generateWelcomeSMSBody,
} = require("../utils/SMSBodyGenerator");
dotenv.config();
let currencyConverter = new CC();

const signUp = async (req, res) => {
  // Edited by Abdelwahab
  const { email, phoneNumber, language } = req.body;
  await validateTeacher.validate({ email });

  const teacher = await Teacher.findOne({
    where: {
      email,
      isRegistered: true,
    },
  });

  const student = await Student.findOne({
    where: {
      email,
      isRegistered: true,
    },
  });

  const parent = await Parent.findOne({
    where: {
      email,
    },
  });

  if (teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "الإيميل مستخدم سابقا",
      english: "email is already used",
    });
  if (student)
    throw serverErrs.BAD_REQUEST({
      arabic: "الإيميل مستخدم سابقا",
      english: "email is already used",
    });
  if (parent)
    throw serverErrs.BAD_REQUEST({
      arabic: "الإيميل مستخدم سابقا",
      english: "email is already used",
    });

  const code = generateRandomCode();

  const existTeacher = await Teacher.findOne({
    where: {
      email,
      isRegistered: false,
    },
  });
  if (existTeacher) await existTeacher.update({ registerCode: code });
  else {
    const newTeacher = await Teacher.create({
      email,
      /*Added by Abdelwahab*/
      phone: phoneNumber,
      registerCode: code,
    });
  }
  const mailOptions = generateConfirmEmailBody(code, language, email);

  // added by Abdelwahab
  const smsOptions = {
    body: generateConfirmEmailSMSBody(language, code),
    to: phoneNumber,
  };
  sendEmail(mailOptions, smsOptions);
  res.send({
    status: 201,
    msg: { arabic: "تم ارسال الإيميل بنجاح", english: "successful send email" },
  });
};

const verifyCode = async (req, res) => {
  const { registerCode, email, long, lat } = req.body;

  const student = await Student.findOne({
    where: {
      email,
      isRegistered: true,
    },
  });

  const parent = await Parent.findOne({
    where: {
      email,
    },
  });

  const registeredTeacher = await Teacher.findOne({
    where: {
      email,
      isRegistered: true,
    },
  });
  if (registeredTeacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "الإيميل مستخدم سابقا",
      english: "email is already used",
    });
  if (student)
    throw serverErrs.BAD_REQUEST({
      arabic: "الإيميل مستخدم سابقا",
      english: "email is already used",
    });
  if (parent)
    throw serverErrs.BAD_REQUEST({
      arabic: "الإيميل مستخدم سابقا",
      english: "email is already used",
    });

  const teacher = await Teacher.findOne({
    where: {
      email,
      registerCode,
    },
  });

  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "الكود خاطئ",
      english: "code is wrong",
    });

  await teacher.update({ isRegistered: true, long, lat });

  res.send({
    status: 201,
    data: teacher,
    msg: {
      arabic: "تم التحقق من الكود واضافة الموقع بنجاح",
      english: "Verified code and add address successfully",
    },
  });
};

const signPassword = async (req, res) => {
  const { email, password, language } = req.body;

  let teacher = await Teacher.findOne({
    where: {
      email,
      isRegistered: true,
    },
  });

  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "الإيميل مستخدم سابقا",
      english: "email is already used",
    });

  const hashedPassword = await hash(password, 12);

  await teacher.update({ password: hashedPassword });
  await teacher.save();

  const token = await generateToken({
    userId: teacher.id,
    name: teacher.name,
    role: "teacher",
  });

  const mailOptions = generateWelcomeEmailBody(
    language,
    teacher.firstName + " " + teacher.lastName,
    email
  );
  // added by Abdelwahab
  const smsOptions = {
    body: generateWelcomeSMSBody(
      language,
      teacher.firstName + " " + teacher.lastName
    ),
    to: teacher.phone,
  };
  sendEmail(mailOptions, smsOptions);
  teacher = {
    id: teacher.id,
    email: teacher.email,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    phone: teacher.phone,
    gender: teacher.gender,
    image: teacher.image,
    videoLink: teacher.videoLink,
    dateOfBirth: teacher.dateOfBirth,
    city: teacher.city,
    country: teacher.country,
    haveExperience: teacher.haveExperience,
    experienceYears: teacher.experienceYears,
    favStdGender: teacher.favStdGender,
    haveCertificates: teacher.haveCertificates,
    favHours: teacher.favHours,
    timeZone: teacher.timeZone,
    articleExperience: teacher.articleExperience,
    shortHeadlineAr: teacher.shortHeadlineAr,
    shortHeadlineEn: teacher.shortHeadlineEn,
    descriptionAr: teacher.descriptionAr,
    descriptionEn: teacher.descriptionEn,
    instantBooking: teacher.instantBooking,
    isRegistered: teacher.isRegistered,
    isVerified: teacher.isVerified,
    registerCode: teacher.registerCode,
    rate: teacher.rate,
    totalAmount: teacher.totalAmount,
    dues: teacher.dues,
    hoursNumbers: teacher.hoursNumbers,
    bookingNumbers: teacher.bookingNumbers,
    long: teacher.long,
    lat: teacher.lat,
    createdAt: teacher.createdAt,
    updatedAt: teacher.updatedAt,
  };
  res.send({
    status: 201,
    data: teacher,
    msg: { arabic: "تم التسجيل بنجاح", english: "successful sign up" },
    token: token,
  });
};

const signAbout = async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await Teacher.findOne({ where: { id: teacherId } });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  if (teacher.id != req.user.userId)
    throw serverErrs.BAD_REQUEST({
      arabic: "لا يوجد حق بالوصول",
      english: "No Auth ",
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

  if (teacher.id != req.user.userId)
    throw serverErrs.BAD_REQUEST({
      arabic: "لا يوجد حق بالوصول",
      english: "No Auth ",
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

const getSingleTeacher = async (req, res) => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findOne({
    where: { id: teacherId },
    include: [
      { model: LangTeachStd, include: [Language] },
      { model: Experience },
      { model: EducationDegree },
      { model: Certificates },
      { model: TeacherDay, include: [Days] },
      { model: TeacherLevel, include: [Level] },
      { model: CurriculumTeacher, include: [Curriculum] },
      { model: TeacherSubject, include: [Subject] },
      { model: RemoteSession },
      { model: F2FSessionStd },
      { model: F2FSessionTeacher },
    ],
    attributes: { exclude: ["password"] },
  });

  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  res.send({
    status: 201,
    data: teacher,
    msg: {
      arabic: "تم إرجاع معلومات المدرب بنجاح",
      english: "successful get single trainer",
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

  if (teacher.id != req.user.userId)
    throw serverErrs.BAD_REQUEST({
      arabic: "لا يوجد حق بالوصول",
      english: "No Auth ",
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

const addSubjects = async (req, res) => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findOne({ where: { id: teacherId } });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  if (teacher.id != req.user.userId)
    throw serverErrs.BAD_REQUEST({
      arabic: "لا يوجد حق بالوصول",
      english: "No Auth ",
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
  let currency = "OMR";
  if (remote || f2fStudent || f2fTeacher) {
    currency = remote?.currency || f2fStudent?.currency || f2fTeacher?.currency;
  }
  const conversionRate = await currencyConverter
    .from(currency)
    .to("OMR")
    .amount(1)
    .convert();
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
    remote["priceAfterDiscount"] = +remote.priceAfterDiscount * conversionRate;
    remote["price"] = +remote.price * conversionRate;
    remote.currency = "OMR";
    await RemoteSession.create(remote).then(() =>
      console.log("trainer remote session has been saved")
    );
  }
  if (f2fStudent) {
    f2fStudent["priceAfterDiscount"] =
      +f2fStudent.price - +f2fStudent.price * (+f2fStudent.discount / 100.0);
    f2fStudent["priceAfterDiscount"] =
      +f2fStudent.priceAfterDiscount * conversionRate;
    f2fStudent["price"] = +f2fStudent.price * conversionRate;
    f2fStudent.currency = "OMR";
    await F2FSessionStd.create(f2fStudent).then(() =>
      console.log("teacher session at home student has been saved")
    );
  }
  if (f2fTeacher) {
    f2fTeacher["priceAfterDiscount"] =
      +f2fTeacher.price - +f2fTeacher.price * (+f2fTeacher.discount / 100.0);
    f2fTeacher["priceAfterDiscount"] =
      +f2fTeacher.priceAfterDiscount * conversionRate;
    f2fTeacher["price"] = +f2fTeacher.price * conversionRate;
    f2fTeacher.currency = "OMR";
    await F2FSessionTeacher.create(f2fTeacher).then(() =>
      console.log("trainer session at trainer home has been saved")
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

  if (teacher.id != req.user.userId)
    throw serverErrs.BAD_REQUEST({
      arabic: "لا يوجد حق بالوصول",
      english: "No Auth ",
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

  if (teacher.id != req.user.userId)
    throw serverErrs.BAD_REQUEST({
      arabic: "لا يوجد حق بالوصول",
      english: "No Auth ",
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

const signResume = async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await Teacher.findOne({ where: { id: teacherId } });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "Invalid trainerId! ",
    });

  if (teacher.id != req.user.userId)
    throw serverErrs.BAD_REQUEST({
      arabic: "لا يوجد حق بالوصول",
      english: "No Auth ",
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

  if (teacher.id != req.user.userId)
    throw serverErrs.BAD_REQUEST({
      arabic: "لا يوجد حق بالوصول",
      english: "No Auth ",
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

const searchTeacherFilterSide = async (req, res) => {
  const { videoLink, gender, LanguageId, CurriculumId } = req.body;
  const { currency } = req.query;
  let whereTeacher = { isVerified: 1, isRegistered: true };
  const whereInclude = [
    {
      model: F2FSessionTeacher,
    },
    {
      model: F2FSessionStd,
    },
    {
      model: RemoteSession,
    },
  ];
  if (videoLink) {
    whereTeacher["videoLink"] = { [Op.not]: "" };
  }
  if (gender == "male" || gender == "female") {
    whereTeacher["gender"] = gender;
  }
  if (LanguageId) {
    whereInclude.push({
      model: LangTeachStd,
      where: { LanguageId: 1 },
    });
  } else {
    whereInclude.push({
      model: LangTeachStd,
    });
  }
  if (CurriculumId !== "all") {
    whereInclude.push({
      model: CurriculumTeacher,
      where: { CurriculumId: +CurriculumId },
    });
  }

  const teachers = await Teacher.findAll({
    where: whereTeacher,
    include: whereInclude,
    attributes: { exclude: ["password"] },
  });

  await Promise.all(
    teachers.map(async (teacher) => {
      try {
        if (teacher.RemoteSession !== null) {
          const newPriceRemote = await currencyConverter
            .from(teacher.RemoteSession.currency)
            .to(currency)
            .amount(+teacher.RemoteSession.priceAfterDiscount)
            .convert();
          teacher.RemoteSession.priceAfterDiscount = newPriceRemote;
          teacher.RemoteSession.currency = currency;
        }
        if (teacher.F2FSessionStd !== null) {
          const newPriceF2FStudent = await currencyConverter
            .from(teacher.F2FSessionStd.currency)
            .to(currency)
            .amount(+teacher.F2FSessionStd.priceAfterDiscount)
            .convert();
          teacher.F2FSessionStd.priceAfterDiscount = newPriceF2FStudent;
          teacher.F2FSessionStd.currency = currency;
        }
        if (teacher.F2FSessionTeacher !== null) {
          const newPriceF2FTeacher = await currencyConverter
            .from(teacher.F2FSessionTeacher.currency)
            .to(currency)
            .amount(+teacher.F2FSessionTeacher.priceAfterDiscount)
            .convert();
          teacher.F2FSessionTeacher.priceAfterDiscount = newPriceF2FTeacher;
          teacher.F2FSessionTeacher.currency = currency;
        }
      } catch (error) {
        console.error(error);
      } finally {
        return teacher;
      }
    })
  );

  res.send({
    status: 201,
    data: teachers,
    msg: {
      arabic: "تم البحث بنجاح",
      english: "successful search",
    },
  });
};

const searchTeacherFilterTop = async (req, res) => {
  const { LevelId } = req.body;
  let { subjects } = req.body;
  const { currency } = req.query;

  if (typeof subjects === "string") {
    subjects = JSON.parse(subjects);
  }

  const whereInclude = [
    {
      model: F2FSessionTeacher,
    },
    {
      model: F2FSessionStd,
    },
    {
      model: RemoteSession,
    },
  ];

  if (LevelId !== "all") {
    whereInclude.push({
      model: TeacherLevel,
      where: { LevelId: +LevelId },
    });
  }

  if (subjects.length > 0) {
    whereInclude.push({
      model: TeacherSubject,
      where: {
        SubjectId: {
          [Op.or]: subjects,
        },
      },
    });
  }

  const teachers = await Teacher.findAll({
    where: { isVerified: 1 },
    include: whereInclude,
    attributes: { exclude: ["password"] },
  });

  await Promise.all(
    teachers.map(async (teacher) => {
      if (teacher.RemoteSession) {
        const newPriceRemote = await currencyConverter
          .from(teacher.RemoteSession.currency)
          .to(currency)
          .amount(+teacher.RemoteSession.priceAfterDiscount)
          .convert();
        teacher.RemoteSession.priceAfterDiscount = newPriceRemote;
        teacher.RemoteSession.currency = currency;
      }
      if (teacher.F2FSessionStd) {
        const newPriceF2FStudent = await currencyConverter
          .from(teacher.F2FSessionStd.currency)
          .to(currency)
          .amount(+teacher.F2FSessionStd.priceAfterDiscount)
          .convert();
        teacher.F2FSessionStd.priceAfterDiscount = newPriceF2FStudent;
        teacher.F2FSessionStd.currency = currency;
      }
      if (teacher.F2FSessionTeacher) {
        const newPriceF2FTeacher = await currencyConverter
          .from(teacher.F2FSessionTeacher.currency)
          .to(currency)
          .amount(+teacher.F2FSessionTeacher.priceAfterDiscount)
          .convert();
        teacher.F2FSessionTeacher.priceAfterDiscount = newPriceF2FTeacher;
        teacher.F2FSessionTeacher.currency = currency;
      }
      return teacher;
    })
  );

  res.send({
    status: 201,
    data: teachers,
    msg: {
      arabic: "تم البحث بنجاح",
      english: "successful search",
    },
  });
};

const resetPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { TeacherId } = req.params;
  const teacher = await Teacher.findOne({
    where: { id: TeacherId },
    include: { all: true },
  });
  if (!teacher)
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "trainer not found",
    });
  const result = await compare(oldPassword, teacher?.password);
  if (!result)
    throw serverErrs.BAD_REQUEST({
      arabic: "كلمة المرور غير صحيحة",
      english: "Old password is wrong",
    });
  const hashedPassword = await hash(newPassword, 12);
  await teacher.update({ password: hashedPassword });
  res.send({
    status: 201,
    data: teacher,
    msg: {
      arabic: "تم تحديث كلمة المرور بنجاح",
      english: "successful update trainer password",
    },
  });
};

const getAllLessons = async (req, res) => {
  const { TeacherId } = req.params;

  const lessons = await Session.findAll({
    where: {
      TeacherId,
      isPaid: true,
    },
    include: [{ model: Student }],
  });

  res.send({
    status: 201,
    data: lessons,
    msg: {
      arabic: "تم إرجاع جميع الدروس بنجاح",
      english: "successful get all lessons",
    },
  });
};
const getMyStudents = async (req, res) => {
  const { TeacherId } = req.params;

  const students = await Student.findAll({
    include: [
      {
        model: Session,
        on: Session.StudentId,
        where: {
          TeacherId: TeacherId,
        },
        attributes: [],
      },
    ],
    attributes: { exclude: ["password"] },
  });
  console.log(students);
  res.send({
    status: 201,
    data: students,
    msg: {
      arabic: "تم ارجاع جميع تلاميذ المدرب بنجاح",
      english: "successful get all teacher students",
    },
  });
};

const getCredit = async (req, res) => {
  const { TeacherId } = req.params;

  const teacher = await Teacher.findOne({
    where: {
      id: TeacherId,
    },
  });

  res.send({
    status: 201,
    data: { totalAmount: teacher.totalAmount, dues: teacher.dues },
    msg: {
      arabic: "تم إرجاع مستحقات المدرب بنجاح",
      english: "successful get all trainer credit & dues",
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
      arabic: "تم إرجاع السجل المالي بنجاح",
      english: "successful get all financial records",
    },
  });
};

const updateNotification = async (req, res) => {
  const { TeacherId } = req.params;
  const notificationsRef = db.collection("Notifications");
  const query = notificationsRef.where("TeacherId", "==", TeacherId);

  query.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const notificationRef = notificationsRef.doc(doc.id);
      notificationRef.update({ seen: true });
    });
  });

  res.send({
    status: 201,
    msg: {
      arabic: "تم رؤية جميع الإشعارات ",
      english: "successful seen for all Notification",
    },
  });
};

const getTeacherRate = async (req, res) => {
  const { TeacherId } = req.params;
  const rates = await Rate.findAll({
    where: {
      TeacherId,
    },
  });

  res.send({
    status: 201,
    data: rates,
    msg: {
      arabic: "تم ارجاع تقييم المدرب بنجاح",
      english: "successful get trainer rate",
    },
  });
};

const acceptLesson = async (req, res) => {
  const { TeacherId } = req.params;
  const { SessionId } = req.body;

  const session = await Session.findOne({
    where: {
      id: SessionId,
      TeacherId,
    },
  });

  if (!session)
    throw serverErrs.BAD_REQUEST({
      arabic: "الجلسة غير موجودة",
      english: "session not found",
    });

  await session.update({ teacherAccept: true });

  res.send({
    status: 201,
    msg: {
      arabic: "تم تعديل الجلسة بنجاح",
      english: "successful update session",
    },
  });
};

const endLesson = async (req, res) => {
  const { TeacherId } = req.params;
  const { SessionId } = req.body;

  const session = await Session.findOne({
    where: {
      id: SessionId,
      TeacherId,
    },
  });

  if (!session)
    throw serverErrs.BAD_REQUEST({
      arabic: "الجلسة غير موجودة",
      english: "session not found",
    });
  console.log("date.now: ", Date.now());
  await session.update({ endedAt: Date.now() });

  res.send({
    status: 201,
    msg: {
      arabic: "تم تعديل الجلسة بنجاح",
      english: "successful update session",
    },
  });
};

const requestCheckout = async (req, res) => {
  const { TeacherId } = req.params;
  const teacher = await Teacher.findOne({ where: { id: TeacherId } });
  if (!teacher) {
    throw serverErrs.BAD_REQUEST({
      arabic: "المدرب غير موجود",
      english: "trainer not found",
    });
  }
  const amount = teacher.totalAmount - teacher.dues;
  const checkoutRequest = await CheckoutRequest.create({
    TeacherId: TeacherId,
    value: amount,
  });
  await teacher.update({
    dues: teacher.dues + amount,
  });
  res.send({
    status: 201,
    data: checkoutRequest,
    msg: {
      arabic: "تم إرسال طلب الدفعة بنجاح",
      english: "successful send request payment",
    },
  });
};
const getProfitRatio = async (req, res) => {
  const admin = await Admin.findOne();
  res.send({
    status: 200,
    profitRatio: admin.profitRatio,
  });
};

module.exports = {
  signUp,
  verifyCode,
  signPassword,
  signAbout,
  signAdditionalInfo,
  getSingleTeacher,
  uploadImage,
  addSubjects,
  addDescription,
  signResume,
  signAvailability,
  signVideoLink,
  searchTeacherFilterSide,
  searchTeacherFilterTop,
  resetPassword,
  getAllLessons,
  getCredit,
  getTeacherFinancial,
  updateNotification,
  getTeacherRate,
  acceptLesson,
  endLesson,
  getMyStudents,
  requestCheckout,
  getProfitRatio,
};
