const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ConnectToDB = require('./Config/db');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
// require('dotenv').config(); // معطل مؤقتاً

// اتصال بقاعدة البيانات
ConnectToDB();

// التحقق من وجود بيانات في قاعدة البيانات
const checkDatabaseData = async () => {
  try {
    // التحقق من وجود معلمين
    const teachersCount = await Teacher.countDocuments();
    const studentsCount = await Student.countDocuments();

    console.log(`إحصائيات قاعدة البيانات:`);
    console.log(`عدد المعلمين: ${teachersCount}`);
    console.log(`عدد الطلاب: ${studentsCount}`);

    // يمكنك إضافة المزيد من التحققات هنا إذا لزم الأمر
  } catch (error) {
    console.error('خطأ في التحقق من بيانات قاعدة البيانات:', error);
  }
};

// تنفيذ التحقق من البيانات
checkDatabaseData();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));

// تسجيل مسار الملفات الثابتة
console.log('Static files path:', path.join(__dirname, 'public'));

// إعداد EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// مسارات التوجيه
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

// استخدام المسارات
app.use('/auth', authRoutes);
app.use('/teacher', teacherRoutes);
app.use('/student', studentRoutes);

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.render('index');
});

// صفحة الخطأ 404 (يجب أن تكون في نهاية المسارات)
app.use((req, res) => {
  res.status(404).render('error', {
    errorTitle: 'الصفحة غير موجودة',
    errorMessage: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
    path: req.originalUrl
  });
});

// تشغيل السيرفر
const PORT = 5000; // تم تعيين القيمة مباشرة بدلاً من process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
