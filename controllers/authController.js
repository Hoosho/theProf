const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// عرض صفحة تسجيل الدخول
module.exports.renderLoginPage = (req, res) => {
  res.render('auth/login');
};

// تسجيل الدخول للطلاب أو المعلمين
module.exports.login = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ errorMessage: 'يرجى إدخال الكود!' });
    }

    // البحث عن الطالب أولاً
    let user = await Student.findById(code);
    let role = 'student';

    // إذا لم يتم العثور على طالب، ابحث عن معلم
    if (!user) {
      user = await Teacher.findById(code);
      role = 'teacher';

      // إذا لم يتم العثور على معلم أيضاً
      if (!user) {
        return res.status(404).json({ errorMessage: 'الكود غير صحيح. يرجى التأكد من الكود والمحاولة مرة أخرى.' });
      }
    }

    const token = generateToken(user._id, role);

    // تخزين التوكن في الكوكيز
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000, // أسبوعين بالمللي ثانية
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
    return res.status(500).json({ errorMessage: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى.' });
  }
};

// تم حذف دالة جلب أكواد الاختبار

// دالة لتوليد التوكن
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRATION_TIME || '14d', // تعديل وقت انتهاء الصلاحية ليكون أسبوعين
  });
};
