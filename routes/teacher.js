// routes/teacher.js
const express = require('express');
const router = express.Router();
const { protect, restrictToTeacher, getUserData } = require('../middlewares/authMiddleware');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const mongoose = require('mongoose');

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



/**
 * @desc Render Students Management Page
 * @route /teacher/students
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/students', (req, res) => {
  res.render('teacher/students', {
    teacherName: req.userData.teacherName
  });
});

/**
 * @desc Get All Students Data
 * @route /teacher/students-data
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/students-data', async (req, res) => {
  try {
    // الحصول على جميع الطلاب المرتبطين بالمعلم الحالي
    const students = await Student.find({ assignedTeacher: req.userData._id });

    return res.status(200).json({
      students
    });
  } catch (error) {
    console.error('خطأ في جلب بيانات الطلاب:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء جلب بيانات الطلاب' });
  }
});

/**
 * @desc Update Student Data
 * @route /teacher/update-student/:id
 * @method PUT
 * @access Private (Only Teacher Can Access This Route)
 */
router.put('/update-student/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName, studentNumber, studentGrade, studentCash } = req.body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (!studentName || !studentNumber || !studentGrade) {
      return res.status(400).json({ errorMessage: 'يرجى إدخال جميع البيانات المطلوبة' });
    }

    // التحقق من وجود الطالب
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الطالب' });
    }

    // التحقق من أن الطالب مرتبط بالمعلم الحالي
    if (student.assignedTeacher.toString() !== req.userData._id.toString()) {
      return res.status(403).json({ errorMessage: 'ليس لديك صلاحية تعديل بيانات هذا الطالب' });
    }

    // التحقق من عدم وجود طالب آخر بنفس رقم الهاتف
    const existingStudent = await Student.findOne({
      studentNumber,
      _id: { $ne: id }
    });

    if (existingStudent) {
      return res.status(400).json({ errorMessage: 'يوجد طالب آخر مسجل بنفس رقم الهاتف' });
    }

    // تحديث بيانات الطالب
    student.studentName = studentName;
    student.studentNumber = studentNumber;
    student.studentGrade = studentGrade;
    student.studentCash = parseInt(studentCash);

    // حفظ التغييرات
    await student.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم تحديث بيانات الطالب بنجاح',
      student: {
        id: student._id,
        name: student.studentName,
        grade: student.studentGrade,
        cash: student.studentCash
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث بيانات الطالب:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء تحديث بيانات الطالب' });
  }
});

/**
 * @desc Add Cash to Student
 * @route /teacher/add-cash/:id
 * @method PUT
 * @access Private (Only Teacher Can Access This Route)
 */
router.put('/add-cash/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // التحقق من وجود المبلغ
    if (!amount || amount <= 0) {
      return res.status(400).json({ errorMessage: 'يرجى إدخال مبلغ صحيح' });
    }

    // التحقق من وجود الطالب
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الطالب' });
    }

    // التحقق من أن الطالب مرتبط بالمعلم الحالي
    if (student.assignedTeacher.toString() !== req.userData._id.toString()) {
      return res.status(403).json({ errorMessage: 'ليس لديك صلاحية تعديل بيانات هذا الطالب' });
    }

    // إضافة المبلغ إلى رصيد الطالب
    student.studentCash += parseInt(amount);

    // حفظ التغييرات
    await student.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: `تم إضافة ${amount} جنيه إلى رصيد الطالب بنجاح`,
      student: {
        id: student._id,
        name: student.studentName,
        cash: student.studentCash
      }
    });
  } catch (error) {
    console.error('خطأ في إضافة رصيد للطالب:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء إضافة رصيد للطالب' });
  }
});

/**
 * @desc Delete Student
 * @route /teacher/delete-student/:id
 * @method DELETE
 * @access Private (Only Teacher Can Access This Route)
 */
router.delete('/delete-student/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // التحقق من وجود الطالب
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الطالب' });
    }

    // التحقق من أن الطالب مرتبط بالمعلم الحالي
    if (student.assignedTeacher.toString() !== req.userData._id.toString()) {
      return res.status(403).json({ errorMessage: 'ليس لديك صلاحية حذف هذا الطالب' });
    }

    // حذف الطالب
    await Student.findByIdAndDelete(id);

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم حذف الطالب بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الطالب:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء حذف الطالب' });
  }
});

/**
 * @desc Render Months Management Page
 * @route /teacher/months-list
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/months-list', (req, res) => {
  res.render('teacher/months-list', {
    teacherName: req.userData.teacherName
  });
});

/**
 * @desc Get All Months Data
 * @route /teacher/months-data
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/months-data', async (req, res) => {
  try {
    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    return res.status(200).json({
      months: teacher.availableMonths
    });
  } catch (error) {
    console.error('خطأ في جلب بيانات الشهور:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء جلب بيانات الشهور' });
  }
});

/**
 * @desc Update Month Data
 * @route /teacher/update-month/:id
 * @method PUT
 * @access Private (Only Teacher Can Access This Route)
 */
router.put('/update-month/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade, price } = req.body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (!name || grade === undefined || !price) {
      return res.status(400).json({ errorMessage: 'يرجى إدخال جميع البيانات المطلوبة' });
    }

    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    // البحث عن الشهر وتحديثه
    const monthIndex = teacher.availableMonths.findIndex(month => month.id === parseInt(id));
    if (monthIndex === -1) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الشهر' });
    }

    // تحديث بيانات الشهر
    teacher.availableMonths[monthIndex].name = name;
    teacher.availableMonths[monthIndex].grade = grade;
    teacher.availableMonths[monthIndex].pricOfMonth = price;

    // حفظ التغييرات
    await teacher.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم تحديث بيانات الشهر بنجاح',
      month: teacher.availableMonths[monthIndex]
    });
  } catch (error) {
    console.error('خطأ في تحديث بيانات الشهر:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء تحديث بيانات الشهر' });
  }
});

/**
 * @desc Delete Month
 * @route /teacher/delete-month/:id
 * @method DELETE
 * @access Private (Only Teacher Can Access This Route)
 */
router.delete('/delete-month/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    // البحث عن الشهر
    const monthIndex = teacher.availableMonths.findIndex(month => month.id === parseInt(id));
    if (monthIndex === -1) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الشهر' });
    }

    // حذف جميع الدروس المرتبطة بالشهر
    teacher.availableClasses = teacher.availableClasses.filter(
      lesson => lesson.monthId !== parseInt(id)
    );

    // حذف الشهر
    teacher.availableMonths.splice(monthIndex, 1);

    // حفظ التغييرات
    await teacher.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم حذف الشهر والدروس المرتبطة به بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الشهر:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء حذف الشهر' });
  }
});

/**
 * @desc Render Classes Management Page
 * @route /teacher/classes-list
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/classes-list', (req, res) => {
  res.render('teacher/classes-list', {
    teacherName: req.userData.teacherName,
    monthId: req.query.monthId || null
  });
});

/**
 * @desc Get All Classes Data
 * @route /teacher/classes-data
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/classes-data', async (req, res) => {
  try {
    const { monthId } = req.query;

    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    let classes = teacher.availableClasses;

    // إذا تم تحديد شهر معين، قم بتصفية الدروس
    if (monthId) {
      classes = classes.filter(lesson => lesson.monthId === parseInt(monthId));
    }

    return res.status(200).json({
      classes,
      months: teacher.availableMonths
    });
  } catch (error) {
    console.error('خطأ في جلب بيانات الدروس:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء جلب بيانات الدروس' });
  }
});

/**
 * @desc Update Class Data
 * @route /teacher/update-class/:id
 * @method PUT
 * @access Private (Only Teacher Can Access This Route)
 */
router.put('/update-class/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, grade, monthId, url, pdf, exams } = req.body;

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

    // البحث عن الدرس وتحديثه
    const classIndex = teacher.availableClasses.findIndex(lesson => lesson.id === parseInt(id));
    if (classIndex === -1) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الدرس' });
    }

    // تحديث بيانات الدرس
    teacher.availableClasses[classIndex].title = title;
    teacher.availableClasses[classIndex].description = description;
    teacher.availableClasses[classIndex].grade = parseInt(grade);
    teacher.availableClasses[classIndex].monthId = parseInt(monthId);
    teacher.availableClasses[classIndex].url = url;
    teacher.availableClasses[classIndex].pdf = pdf || '';
    teacher.availableClasses[classIndex].exams = exams || '';

    // حفظ التغييرات
    await teacher.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم تحديث بيانات الدرس بنجاح',
      class: teacher.availableClasses[classIndex]
    });
  } catch (error) {
    console.error('خطأ في تحديث بيانات الدرس:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء تحديث بيانات الدرس' });
  }
});

/**
 * @desc Delete Class
 * @route /teacher/delete-class/:id
 * @method DELETE
 * @access Private (Only Teacher Can Access This Route)
 */
router.delete('/delete-class/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    // البحث عن الدرس
    const classIndex = teacher.availableClasses.findIndex(lesson => lesson.id === parseInt(id));
    if (classIndex === -1) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الدرس' });
    }

    // حذف الدرس
    teacher.availableClasses.splice(classIndex, 1);

    // حفظ التغييرات
    await teacher.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم حذف الدرس بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الدرس:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء حذف الدرس' });
  }
});

/**
 * @desc Render Students Management Page
 * @route /teacher/students
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/students', (req, res) => {
  res.render('teacher/students', {
    teacherName: req.userData.teacherName
  });
});

/**
 * @desc Get All Students Data
 * @route /teacher/students-data
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/students-data', async (req, res) => {
  try {
    // الحصول على جميع الطلاب المرتبطين بالمعلم الحالي
    const students = await Student.find({ assignedTeacher: req.userData._id });

    return res.status(200).json({
      students
    });
  } catch (error) {
    console.error('خطأ في جلب بيانات الطلاب:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء جلب بيانات الطلاب' });
  }
});

/**
 * @desc Update Student Data
 * @route /teacher/update-student/:id
 * @method PUT
 * @access Private (Only Teacher Can Access This Route)
 */
router.put('/update-student/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName, studentNumber, studentGrade, studentCash } = req.body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (!studentName || !studentNumber || !studentGrade) {
      return res.status(400).json({ errorMessage: 'يرجى إدخال جميع البيانات المطلوبة' });
    }

    // التحقق من وجود الطالب
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الطالب' });
    }

    // التحقق من أن الطالب مرتبط بالمعلم الحالي
    if (student.assignedTeacher.toString() !== req.userData._id.toString()) {
      return res.status(403).json({ errorMessage: 'ليس لديك صلاحية تعديل بيانات هذا الطالب' });
    }

    // التحقق من عدم وجود طالب آخر بنفس رقم الهاتف
    const existingStudent = await Student.findOne({
      studentNumber,
      _id: { $ne: id }
    });

    if (existingStudent) {
      return res.status(400).json({ errorMessage: 'يوجد طالب آخر مسجل بنفس رقم الهاتف' });
    }

    // تحديث بيانات الطالب
    student.studentName = studentName;
    student.studentNumber = studentNumber;
    student.studentGrade = studentGrade;
    student.studentCash = parseInt(studentCash);

    // حفظ التغييرات
    await student.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم تحديث بيانات الطالب بنجاح',
      student: {
        id: student._id,
        name: student.studentName,
        grade: student.studentGrade,
        cash: student.studentCash
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث بيانات الطالب:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء تحديث بيانات الطالب' });
  }
});

/**
 * @desc Add Cash to Student
 * @route /teacher/add-cash/:id
 * @method PUT
 * @access Private (Only Teacher Can Access This Route)
 */
router.put('/add-cash/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // التحقق من وجود المبلغ
    if (!amount || amount <= 0) {
      return res.status(400).json({ errorMessage: 'يرجى إدخال مبلغ صحيح' });
    }

    // التحقق من وجود الطالب
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الطالب' });
    }

    // التحقق من أن الطالب مرتبط بالمعلم الحالي
    if (student.assignedTeacher.toString() !== req.userData._id.toString()) {
      return res.status(403).json({ errorMessage: 'ليس لديك صلاحية تعديل بيانات هذا الطالب' });
    }

    // إضافة المبلغ إلى رصيد الطالب
    student.studentCash += parseInt(amount);

    // حفظ التغييرات
    await student.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: `تم إضافة ${amount} جنيه إلى رصيد الطالب بنجاح`,
      student: {
        id: student._id,
        name: student.studentName,
        cash: student.studentCash
      }
    });
  } catch (error) {
    console.error('خطأ في إضافة رصيد للطالب:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء إضافة رصيد للطالب' });
  }
});

/**
 * @desc Delete Student
 * @route /teacher/delete-student/:id
 * @method DELETE
 * @access Private (Only Teacher Can Access This Route)
 */
router.delete('/delete-student/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // التحقق من وجود الطالب
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الطالب' });
    }

    // التحقق من أن الطالب مرتبط بالمعلم الحالي
    if (student.assignedTeacher.toString() !== req.userData._id.toString()) {
      return res.status(403).json({ errorMessage: 'ليس لديك صلاحية حذف هذا الطالب' });
    }

    // حذف الطالب
    await Student.findByIdAndDelete(id);

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم حذف الطالب بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الطالب:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء حذف الطالب' });
  }
});

/**
 * @desc Render Months Management Page
 * @route /teacher/months-list
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/months-list', (req, res) => {
  res.render('teacher/months-list', {
    teacherName: req.userData.teacherName
  });
});

/**
 * @desc Get All Months Data
 * @route /teacher/months-data
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/months-data', async (req, res) => {
  try {
    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    return res.status(200).json({
      months: teacher.availableMonths
    });
  } catch (error) {
    console.error('خطأ في جلب بيانات الشهور:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء جلب بيانات الشهور' });
  }
});

/**
 * @desc Update Month Data
 * @route /teacher/update-month/:id
 * @method PUT
 * @access Private (Only Teacher Can Access This Route)
 */
router.put('/update-month/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade, price } = req.body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (!name || grade === undefined || !price) {
      return res.status(400).json({ errorMessage: 'يرجى إدخال جميع البيانات المطلوبة' });
    }

    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    // البحث عن الشهر وتحديثه
    const monthIndex = teacher.availableMonths.findIndex(month => month.id === parseInt(id));
    if (monthIndex === -1) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الشهر' });
    }

    // تحديث بيانات الشهر
    teacher.availableMonths[monthIndex].name = name;
    teacher.availableMonths[monthIndex].grade = grade;
    teacher.availableMonths[monthIndex].pricOfMonth = price;

    // حفظ التغييرات
    await teacher.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم تحديث بيانات الشهر بنجاح',
      month: teacher.availableMonths[monthIndex]
    });
  } catch (error) {
    console.error('خطأ في تحديث بيانات الشهر:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء تحديث بيانات الشهر' });
  }
});

/**
 * @desc Delete Month
 * @route /teacher/delete-month/:id
 * @method DELETE
 * @access Private (Only Teacher Can Access This Route)
 */
router.delete('/delete-month/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    // البحث عن الشهر
    const monthIndex = teacher.availableMonths.findIndex(month => month.id === parseInt(id));
    if (monthIndex === -1) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الشهر' });
    }

    // حذف جميع الدروس المرتبطة بالشهر
    teacher.availableClasses = teacher.availableClasses.filter(
      lesson => lesson.monthId !== parseInt(id)
    );

    // حذف الشهر
    teacher.availableMonths.splice(monthIndex, 1);

    // حفظ التغييرات
    await teacher.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم حذف الشهر والدروس المرتبطة به بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الشهر:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء حذف الشهر' });
  }
});

/**
 * @desc Render Classes Management Page
 * @route /teacher/classes-list
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/classes-list', (req, res) => {
  res.render('teacher/classes-list', {
    teacherName: req.userData.teacherName,
    monthId: req.query.monthId || null
  });
});

/**
 * @desc Get All Classes Data
 * @route /teacher/classes-data
 * @method GET
 * @access Private (Only Teacher Can Access This Route)
 */
router.get('/classes-data', async (req, res) => {
  try {
    const { monthId } = req.query;

    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    let classes = teacher.availableClasses;

    // إذا تم تحديد شهر معين، قم بتصفية الدروس
    if (monthId) {
      classes = classes.filter(lesson => lesson.monthId === parseInt(monthId));
    }

    return res.status(200).json({
      classes,
      months: teacher.availableMonths
    });
  } catch (error) {
    console.error('خطأ في جلب بيانات الدروس:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء جلب بيانات الدروس' });
  }
});

/**
 * @desc Update Class Data
 * @route /teacher/update-class/:id
 * @method PUT
 * @access Private (Only Teacher Can Access This Route)
 */
router.put('/update-class/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, grade, monthId, url, pdf, exams } = req.body;

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

    // البحث عن الدرس وتحديثه
    const classIndex = teacher.availableClasses.findIndex(lesson => lesson.id === parseInt(id));
    if (classIndex === -1) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الدرس' });
    }

    // تحديث بيانات الدرس
    teacher.availableClasses[classIndex].title = title;
    teacher.availableClasses[classIndex].description = description;
    teacher.availableClasses[classIndex].grade = parseInt(grade);
    teacher.availableClasses[classIndex].monthId = parseInt(monthId);
    teacher.availableClasses[classIndex].url = url;
    teacher.availableClasses[classIndex].pdf = pdf || '';
    teacher.availableClasses[classIndex].exams = exams || '';

    // حفظ التغييرات
    await teacher.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم تحديث بيانات الدرس بنجاح',
      class: teacher.availableClasses[classIndex]
    });
  } catch (error) {
    console.error('خطأ في تحديث بيانات الدرس:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء تحديث بيانات الدرس' });
  }
});

/**
 * @desc Delete Class
 * @route /teacher/delete-class/:id
 * @method DELETE
 * @access Private (Only Teacher Can Access This Route)
 */
router.delete('/delete-class/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // الحصول على المعلم الحالي
    const teacher = await Teacher.findById(req.userData._id);
    if (!teacher) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على المعلم' });
    }

    // البحث عن الدرس
    const classIndex = teacher.availableClasses.findIndex(lesson => lesson.id === parseInt(id));
    if (classIndex === -1) {
      return res.status(404).json({ errorMessage: 'لم يتم العثور على الدرس' });
    }

    // حذف الدرس
    teacher.availableClasses.splice(classIndex, 1);

    // حفظ التغييرات
    await teacher.save();

    // إرجاع استجابة نجاح
    return res.status(200).json({
      message: 'تم حذف الدرس بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الدرس:', error);
    return res.status(500).json({ errorMessage: 'حدث خطأ أثناء حذف الدرس' });
  }
});

module.exports = router;
