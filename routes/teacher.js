// routes/teacher.js
const express = require('express');
const router = express.Router();
const { protect, restrictToTeacher, getUserData } = require('../middlewares/authMiddleware');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// تطبيق middleware المصادقة على جميع مسارات المعلم
router.use(protect);
router.use(restrictToTeacher);
router.use(getUserData);

/**
 * @desc Get Teacher Dashboard
 * @route /teacher/dashboard
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/dashboard', (req, res) => {
  res.render('teacher/dashboard', {
    teacherName: req.userData.teacherName
  });
});



/**
 * @desc Render Add Student Page
 * @route /teacher/add-student
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/add-student', (req, res) => {
  res.render('teacher/add-student', {
    teacherName: req.userData.teacherName
  });
});

/**
 * @desc Add New Student
 * @route /teacher/add-student
 * @method POST
 * @access Private (Only Teacher Can Access This Route)
 */
router.post('/add-student', async (req, res) => {
  try {
    const { studentName, studentNumber, studentGrade } = req.body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (!studentName || !studentNumber || !studentGrade) {
      return res.status(400).json({ errorMessage: 'يرجى إدخال جميع البيانات المطلوبة' });
    }

    // التحقق من عدم وجود طالب بنفس رقم الهاتف
    const existingStudent = await Student.findOne({ studentNumber });
    if (existingStudent) {
      return res.status(400).json({ errorMessage: 'يوجد طالب مسجل بنفس رقم الهاتف' });
    }

    // إنشاء طالب جديد
    const newStudent = new Student({
      studentName,
      studentNumber,
      studentGrade,
      studentCash: 0, // رصيد افتراضي
      assignedTeacher: req.userData._id, // تعيين المعلم الحالي
      codeStatus: true, // تفعيل الكود افتراضيًا
    });

    // حفظ الطالب في قاعدة البيانات
    await newStudent.save();

    // إرجاع استجابة نجاح
    return res.status(201).json({
      message: 'تم إضافة الطالب بنجاح',
      student: {
        id: newStudent._id,
        name: newStudent.studentName,
        grade: newStudent.studentGrade
      }
    });
  } catch (error) {
    console.error('خطأ في إضافة الطالب:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء إضافة الطالب' });
  }
});

/**
 * @desc Render Create Class Page
 * @route /teacher/create-class
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/create-class', (req, res) => {
  res.render('teacher/create-class', {
    teacherName: req.userData.teacherName
  });
});

/**
 * @desc Get Available Months
 * @route /teacher/months
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/months', async (req, res) => {
  try {
    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    // إرجاع الشهور المتاحة
    return res.status(200).json({
      months: teacher.availableMonths
    });
  } catch (error) {
    console.error('خطأ في جلب الشهور:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء جلب الشهور' });
  }
});

/**
 * @desc Add New Class
 * @route /teacher/create-class
 * @method POST
 * @access Private (Only Teacher Can Access This Route)
 */
router.post('/create-class', async (req, res) => {
  try {
    const { title, id, description, grade, monthId, url, pdf, exams } = req.body;

    // التحقق من وجود البيانات الأساسية
    if (!title || !description || !grade || !monthId || !url) {
      return res.status(400).json({ errorMessage: 'يرجى إدخال جميع البيانات الأساسية' });
    }

    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    // التحقق من وجود الشهر
    const monthExists = teacher.availableMonths.some(month => month.id === parseInt(monthId));
    if (!monthExists) {
      return res.status(400).json({ errorMessage: 'الشهر المحدد غير موجود' });
    }

    // إنشاء درس جديد
    const newClass = {
      id: id || Date.now(), // استخدام الرقم المدخل أو الطابع الزمني كمعرف فريد
      title,
      description,
      grade: parseInt(grade),
      monthId: parseInt(monthId),
      url,
      pdf: pdf || '',
      exams: exams || ''
    };

    // إضافة الدرس إلى قائمة الدروس المتاحة للمعلم
    teacher.availableClasses.push(newClass);

    // حفظ التغييرات
    await teacher.save();

    // إرجاع استجابة نجاح
    return res.status(201).json({
      message: 'تم إضافة الدرس بنجاح',
      class: newClass
    });
  } catch (error) {
    console.error('خطأ في إضافة الدرس:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء إضافة الدرس' });
  }
});

/**
 * @desc Render Create Month Page
 * @route /teacher/create-month
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/create-month', (req, res) => {
  res.render('teacher/create-month', {
    teacherName: req.userData.teacherName
  });
});

/**
 * @desc Add New Month
 * @route /teacher/create-month
 * @method POST
 * @access Private (Only Teacher Can Access This Route)
 */
router.post('/create-month', async (req, res) => {
  try {
    const { name, grade, price } = req.body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (!name || !grade || !price) {
      return res.status(400).json({ errorMessage: 'يرجى إدخال جميع البيانات المطلوبة' });
    }

    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    // إنشاء شهر جديد
    const newMonth = {
      id: Date.now(), // استخدام الطابع الزمني كمعرف فريد
      name,
      grade: parseInt(grade),
      pricOfMonth: parseInt(price)
    };

    // إضافة الشهر إلى قائمة الشهور المتاحة للمعلم
    teacher.availableMonths.push(newMonth);

    // حفظ التغييرات
    await teacher.save();

    // إرجاع استجابة نجاح
    return res.status(201).json({
      message: 'تم إضافة الشهر بنجاح',
      month: newMonth
    });
  } catch (error) {
    console.error('خطأ في إضافة الشهر:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء إضافة الشهر' });
  }
});



module.exports = router;
