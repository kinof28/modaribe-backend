const Admin = require("./Admin");
const Student = require("./Student");
const Parent = require("./Parent");
const Level = require("./Level");
const Wallet = require("./Wallet");
const Class = require("./Class");
const Subject = require("./Subject");
const SubjectCategory = require("./SubjectCategory");
const TeacherSubject = require("./TeacherSubject");
const Days = require("./Days");
const TeacherDay = require("./TeacherDay");
const ParentStudent = require("./ParentStudent");
const EducationDegree = require("./EducationDegree");
const Teacher = require("./Teacher");
const Experience = require("./Experience");
const Time = require("./Time");
const RemoteSession = require("./RemoteSession");
const F2FSessionStd = require("./F2FSessionStd");
const F2FSessionTeacher = require("./F2FSessionTeacher");
const Language = require("./Language");
const LangTeachStd = require("./LangTeachStd");
const Session = require("./Session");
const TeacherLevel = require("./TeacherLevel");
const CurriculumTeacher = require("./CurriculumTeacher");
const Curriculum = require("./Curriculum");
const CurriculumLevel = require("./CurriculumLevel");
const Certificates = require("./Certificates");
const LanguageLevel = require("./LanguageLevel");
const Rate = require("./Rate");
const FinancialRecord = require("./financialRecord");
const SocialMedia = require("./SocialMedia");
// Added by Abdelwahab
const CheckoutRequest = require("./CheckoutRequest");

Teacher.hasMany(LangTeachStd);
LangTeachStd.belongsTo(Teacher);
Language.hasMany(LangTeachStd);
LangTeachStd.belongsTo(Language);
Student.hasMany(LangTeachStd);
LangTeachStd.belongsTo(Student);
Teacher.hasMany(Experience);
LangTeachStd.belongsTo(LanguageLevel);
LanguageLevel.hasMany(LangTeachStd);
Experience.belongsTo(Teacher);
Teacher.hasMany(Session);
Session.belongsTo(Teacher);
Student.hasMany(Session);
Session.belongsTo(Student);
Teacher.hasMany(EducationDegree);
EducationDegree.belongsTo(Teacher);
Teacher.hasMany(Certificates);
Certificates.belongsTo(Teacher);
Teacher.hasMany(TeacherDay);
TeacherDay.belongsTo(Teacher);
Days.hasMany(TeacherDay);
TeacherDay.belongsTo(Days);
// TeacherDay.hasMany(Time);
// Time.belongsTo(TeacherDay);
// Teacher.hasMany(Conversation);
// Conversation.belongsTo(Teacher);
// Student.hasMany(Conversation);
// Conversation.belongsTo(Student);
// Conversation.hasMany(Message);
// Message.belongsTo(Conversation);
// Teacher.hasMany(Message);
// Message.belongsTo(Teacher);
// Student.hasMany(Message);
// Message.belongsTo(Student);
Teacher.hasOne(F2FSessionStd);
F2FSessionStd.belongsTo(Teacher);
Teacher.hasOne(RemoteSession);
RemoteSession.belongsTo(Teacher);
Teacher.hasOne(F2FSessionTeacher);
F2FSessionTeacher.belongsTo(Teacher);
Parent.hasMany(ParentStudent);
ParentStudent.belongsTo(Parent);
Student.hasMany(ParentStudent);
ParentStudent.belongsTo(Student);
Curriculum.hasMany(CurriculumLevel);
CurriculumLevel.belongsTo(Curriculum);
Level.hasMany(CurriculumLevel);
CurriculumLevel.belongsTo(Level);
Level.hasMany(Class);
Class.belongsTo(Level);
Level.hasMany(Student);
Student.belongsTo(Level);
Class.hasMany(Student);
Student.belongsTo(Class);
Level.hasMany(TeacherLevel);
TeacherLevel.belongsTo(Level);
Teacher.hasMany(TeacherLevel);
TeacherLevel.belongsTo(Teacher);
Curriculum.hasMany(CurriculumTeacher);
CurriculumTeacher.belongsTo(Curriculum);
Teacher.hasMany(CurriculumTeacher);
CurriculumTeacher.belongsTo(Teacher);
Curriculum.hasMany(Student);
Student.belongsTo(Curriculum);
SubjectCategory.hasMany(Subject);
Subject.belongsTo(SubjectCategory);
Subject.hasMany(TeacherSubject);
TeacherSubject.belongsTo(Subject);
Teacher.hasMany(TeacherSubject);
TeacherSubject.belongsTo(Teacher);
Student.hasMany(Wallet);
Wallet.belongsTo(Student);
Student.belongsTo(Parent);
Parent.hasMany(Student);
Teacher.hasMany(Rate);
Rate.belongsTo(Teacher);
Student.hasMany(Rate);
Rate.belongsTo(Student);
Teacher.hasMany(FinancialRecord);
FinancialRecord.belongsTo(Teacher);

// Added by Abdelwahab
Student.hasMany(FinancialRecord);
FinancialRecord.belongsTo(Student);
Teacher.hasMany(CheckoutRequest);
CheckoutRequest.belongsTo(Teacher);

module.exports = {
  Admin,
  Student,
  Parent,
  Level,
  Wallet,
  Class,
  Subject,
  SubjectCategory,
  Days,
  TeacherDay,
  ParentStudent,
  EducationDegree,
  Teacher,
  Experience,
  Time,
  RemoteSession,
  F2FSessionStd,
  F2FSessionTeacher,
  Language,
  LangTeachStd,
  Session,
  TeacherLevel,
  Curriculum,
  Certificates,
  CurriculumLevel,
  CurriculumTeacher,
  LanguageLevel,
  FinancialRecord,
  Rate,
  SocialMedia,
  CheckoutRequest,
};
