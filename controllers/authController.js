const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// عرض صفحة تسجيل الدخول
module.exports.renderLoginPage = (req, res) => {
  res.render('auth/login');
};

// تسجيل الدخول للطلاب أو المعلمين
module.exports.studentLogin = async (req, res) => {
  try {
    const { code, role } = req.body;

    // تحقق من أن الدور المدخل صحيح
    if (role !== 'student' && role !== 'teacher') {
      return res.status(400).json({ errorMessage: 'Invalid role provided!' });
    }

    let user;
    if (role === 'student') {
      user = await Student.findById(code);
      if (!user) return res.status(404).json({ errorMessage: 'Student not found!' });
    }

    if (role === 'teacher') {
      user = await Teacher.findById(code);
      if (!user) return res.status(404).json({ errorMessage: 'Teacher not found!' });
    }

    const token = generateToken(user._id, role);

    // تخزين التوكن في الكوكيز
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // تأكد من أن الكوكيز فقط تعمل في وضع HTTPS في البيئة الانتاج
      maxAge: 3600000, // ساعة واحدة
      sameSite: 'Lax',
    });

    return res.status(200).json({
      id: user._id,
      name: user[role === 'student' ? 'studentName' : 'teacherName'],
      role: role,
      authorization: token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ errorMessage: 'Internal Server Error!' });
  }
};

// دالة لجلب أكواد الاختبار
module.exports.getTestIds = async (req, res) => {
  try {
    // جلب أول طالبين
    const students = await Student.find().limit(2);

    // جلب أول معلم
    const teacher = await Teacher.findOne();

    return res.status(200).json({
      student1Id: students[0] ? students[0]._id : null,
      student2Id: students[1] ? students[1]._id : null,
      teacherId: teacher ? teacher._id : null
    });
  } catch (err) {
    console.error('خطأ في جلب أكواد الاختبار:', err);
    return res.status(500).json({ errorMessage: 'Internal Server Error!' });
  }
};

// دالة لتوليد التوكن
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.SECRET_KEY, {
    expiresIn: '2h',
  });
};
