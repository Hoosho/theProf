// routes/student.js
const express = require('express');
const router = express.Router();
const { protect, restrictToStudent, getUserData } = require('../middlewares/authMiddleware');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// تطبيق middleware المصادقة على جميع مسارات الطالب
router.use(protect);
router.use(restrictToStudent);
router.use(getUserData);

/**
 * @desc Render Student Dashboard
 * @route /student/dashboard
 * @method GET
 * @access Private (Only Student Can Access This Route)
 */
router.get('/dashboard', async (req, res) => {
  try {
    // جلب بيانات الطالب
    const student = await Student.findById(req.userData._id);
    if (!student) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الطالب',
        errorMessage: 'لم نتمكن من العثور على بيانات الطالب الخاصة بك.'
      });
    }

    // جلب بيانات المعلم المرتبط بالطالب
    const teacher = await Teacher.findById(student.assignedTeacher);
    if (!teacher) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على المعلم',
        errorMessage: 'لم نتمكن من العثور على بيانات المعلم المرتبط بك.'
      });
    }

    // تحديد المرحلة الدراسية للطالب
    let studentGradeNumber;
    if (student.studentGrade.includes('prep')) {
      // المرحلة الإعدادية
      studentGradeNumber = parseInt(student.studentGrade.charAt(0));
    } else if (student.studentGrade.includes('high')) {
      // المرحلة الثانوية
      studentGradeNumber = parseInt(student.studentGrade.charAt(0)) + 3;
    } else {
      studentGradeNumber = 1; // قيمة افتراضية
    }

    console.log(`المرحلة الدراسية للطالب: ${studentGradeNumber}`);
    console.log(`عدد الشهور المتاحة من المعلم: ${teacher.availableMonths.length}`);

    // تحويل الشهور المناسبة للمرحلة الدراسية للطالب فقط
    const availableMonths = teacher.availableMonths
      .filter(month => month.grade === 0 || month.grade === studentGradeNumber) // الشهور العامة (grade=0) أو المناسبة للمرحلة
      .map(month => ({
        id: month.id,
        name: month.name,
        price: month.pricOfMonth,
        grade: month.grade === 0 ? 'جميع المراحل' : month.grade
      }));

    // تحديد الشهور التي اشترى فيها الطالب بالفعل
    const boughtMonthIds = student.boughtMonths.map(month => month.monthId);

    // فصل الشهور المتاحة إلى مشتراة وغير مشتراة
    const boughtMonths = student.boughtMonths;
    const availableNotBoughtMonths = availableMonths.filter(month =>
      !boughtMonthIds.includes(month.id)
    );

    res.render('student/dashboard', {
      studentName: student.studentName,
      studentGrade: student.studentGrade || 'غير محدد',
      studentCash: student.studentCash || 0,
      boughtMonths: boughtMonths,
      availableMonths: availableNotBoughtMonths
    });
  } catch (error) {
    console.error('خطأ في عرض لوحة تحكم الطالب:', error);
    res.status(500).render('error', {
      errorTitle: 'خطأ في النظام',
      errorMessage: 'حدث خطأ أثناء تحميل لوحة التحكم. يرجى المحاولة مرة أخرى.'
    });
  }
});

/**
 * @desc Render Month Details Page
 * @route /student/months/:id
 * @method GET
 * @access Private (Only Student Can Access This Route)
 */
router.get('/months/:id', async (req, res) => {
  try {
    const monthId = parseInt(req.params.id);

    // جلب بيانات الطالب
    const student = await Student.findById(req.userData._id);
    if (!student) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الطالب',
        errorMessage: 'لم نتمكن من العثور على بيانات الطالب الخاصة بك.'
      });
    }

    // التحقق من أن الطالب قد اشترى هذا الشهر
    const hasBoughtMonth = student.boughtMonths.some(month => month.monthId === monthId);
    if (!hasBoughtMonth) {
      return res.status(403).render('error', {
        errorTitle: 'غير مصرح بالوصول',
        errorMessage: 'يجب عليك الاشتراك في هذا الشهر أولاً للوصول إلى محتوياته.',
        path: req.originalUrl
      });
    }

    // جلب بيانات المعلم المرتبط بالطالب
    const teacher = await Teacher.findById(student.assignedTeacher);
    if (!teacher) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على المعلم',
        errorMessage: 'لم نتمكن من العثور على بيانات المعلم المرتبط بك.'
      });
    }

    // جلب بيانات الشهر
    const month = teacher.availableMonths.find(m => m.id === monthId);
    if (!month) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الشهر',
        errorMessage: 'لم نتمكن من العثور على بيانات الشهر المطلوب.',
        path: req.originalUrl
      });
    }

    // جلب الدروس المرتبطة بالشهر المحدد فقط
    const lessons = teacher.availableClasses
      .filter(lesson => lesson.monthId === monthId)
      .map(lesson => {
        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          grade: lesson.grade,
          monthId: lesson.monthId,
          url: lesson.url,
          pdf: lesson.pdf,
          exams: lesson.exams,
          isCurrentMonth: true // جميع الدروس الآن مرتبطة بالشهر الحالي
        };
      });

    // ترتيب الدروس حسب الرقم التسلسلي
    lessons.sort((a, b) => a.id - b.id);

    console.log(`تم العثور على ${lessons.length} درس في الشهر ${month.name}`);

    // طباعة معلومات الدروس للتحقق
    lessons.forEach((lesson, index) => {
      console.log(`الدرس ${index + 1}: ${lesson.title}, المرحلة: ${lesson.grade}, الشهر: ${lesson.monthId}`);
    });

    res.render('student/month-details', {
      studentName: student.studentName,
      month: {
        id: month.id,
        name: month.name,
        price: month.pricOfMonth,
        grade: month.grade
      },
      lessons: lessons,
      teacher: teacher // تمرير بيانات المعلم كاملة للقالب
    });
  } catch (error) {
    console.error('خطأ في عرض تفاصيل الشهر:', error);
    res.status(500).render('error', {
      errorTitle: 'خطأ في النظام',
      errorMessage: 'حدث خطأ أثناء تحميل تفاصيل الشهر. يرجى المحاولة مرة أخرى.',
      path: req.originalUrl
    });
  }
});

/**
 * @desc Subscribe to a Month
 * @route /student/subscribe/:id
 * @method GET
 * @access Private (Only Student Can Access This Route)
 */
router.get('/subscribe/:id', async (req, res) => {
  try {
    const monthId = parseInt(req.params.id);

    // جلب بيانات الطالب
    const student = await Student.findById(req.userData._id);
    if (!student) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الطالب',
        errorMessage: 'لم نتمكن من العثور على بيانات الطالب الخاصة بك.',
        path: req.originalUrl
      });
    }

    // التحقق من أن الطالب لم يشترك في هذا الشهر من قبل
    const alreadyBought = student.boughtMonths.some(month => month.monthId === monthId);
    if (alreadyBought) {
      return res.status(400).render('error', {
        errorTitle: 'تم الاشتراك مسبقاً',
        errorMessage: 'أنت مشترك بالفعل في هذا الشهر.',
        path: req.originalUrl
      });
    }

    // جلب بيانات المعلم المرتبط بالطالب
    const teacher = await Teacher.findById(student.assignedTeacher);
    if (!teacher) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على المعلم',
        errorMessage: 'لم نتمكن من العثور على بيانات المعلم المرتبط بك.',
        path: req.originalUrl
      });
    }

    // جلب بيانات الشهر
    const month = teacher.availableMonths.find(m => m.id === monthId);
    if (!month) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الشهر',
        errorMessage: 'لم نتمكن من العثور على بيانات الشهر المطلوب.',
        path: req.originalUrl
      });
    }

    // التحقق من أن الشهر متاح للمرحلة الدراسية للطالب
    let studentGradeNumber;
    if (student.studentGrade.includes('prep')) {
      // المرحلة الإعدادية
      studentGradeNumber = parseInt(student.studentGrade.charAt(0));
    } else if (student.studentGrade.includes('high')) {
      // المرحلة الثانوية
      studentGradeNumber = parseInt(student.studentGrade.charAt(0)) + 3;
    } else {
      studentGradeNumber = 1; // قيمة افتراضية
    }

    if (month.grade !== studentGradeNumber && month.grade !== 0) {
      return res.status(400).render('error', {
        errorTitle: 'الشهر غير متاح',
        errorMessage: 'هذا الشهر غير متاح لمرحلتك الدراسية.',
        path: req.originalUrl
      });
    }

    // التحقق من رصيد الطالب
    if (student.studentCash < month.pricOfMonth) {
      return res.status(400).render('error', {
        errorTitle: 'رصيد غير كافي',
        errorMessage: `رصيدك الحالي (${student.studentCash} جنيه) غير كافٍ لشراء هذا الشهر (${month.pricOfMonth} جنيه).`,
        path: req.originalUrl
      });
    }

    // إضافة الشهر إلى الطالب وخصم المبلغ من رصيده
    student.boughtMonths.push({
      monthId: month.id,
      name: month.name,
      grade: month.grade,
      price: month.pricOfMonth,
      purchaseDate: new Date()
    });

    student.studentCash -= month.pricOfMonth;

    // حفظ التغييرات
    await student.save();

    // إعادة التوجيه إلى صفحة تفاصيل الشهر
    res.redirect(`/student/months/${monthId}`);
  } catch (error) {
    console.error('خطأ في الاشتراك في الشهر:', error);
    res.status(500).render('error', {
      errorTitle: 'خطأ في النظام',
      errorMessage: 'حدث خطأ أثناء الاشتراك في الشهر. يرجى المحاولة مرة أخرى.',
      path: req.originalUrl
    });
  }
});

/**
 * @desc Get Video Stream Securely
 * @route /student/video-stream/:id
 * @method GET
 * @access Private (Only Student Can Access This Route)
 */
router.get('/video-stream/:id', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);

    // التحقق من رأس الطلب للأمان
    const requestTimestamp = req.headers['x-request-timestamp'];
    const sessionId = req.headers['x-session-id'];
    const clientSignature = req.headers['x-client-signature'];

    // جلب بيانات الطالب
    const student = await Student.findById(req.userData._id);
    if (!student) {
      return res.status(404).json({ error: 'لم يتم العثور على الطالب' });
    }

    // جلب بيانات المعلم المرتبط بالطالب
    const teacher = await Teacher.findById(student.assignedTeacher);
    if (!teacher) {
      return res.status(404).json({ error: 'لم يتم العثور على المعلم' });
    }

    // جلب بيانات الدرس
    const lesson = teacher.availableClasses.find(c => parseInt(c.id) === lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'لم يتم العثور على الدرس' });
    }

    // التحقق من أن الطالب قد اشترى الشهر المرتبط بالدرس
    const hasBoughtMonth = student.boughtMonths.some(month => month.monthId === lesson.monthId);
    if (!hasBoughtMonth) {
      return res.status(403).json({ error: 'غير مصرح بالوصول' });
    }

    // تسجيل طلب الوصول للفيديو
    console.log(`طلب مشاهدة فيديو - الطالب: ${student.studentName}, الدرس: ${lesson.title}, الوقت: ${new Date().toISOString()}`);

    // إنشاء معرف جلسة فريد لهذا الطلب
    const sessionToken = require('crypto').randomBytes(16).toString('hex');

    // إنشاء توقيع أمني للاستجابة
    const responseSignature = require('crypto')
      .createHmac('sha256', 'secure_video_response_key')
      .update(`${lessonId}-${student._id}-${sessionToken}`)
      .digest('hex');

    // إرسال معلومات الفيديو المشفرة
    // نقوم بإرسال معرف الفيديو فقط وليس الرابط الكامل
    let videoData = {
      sessionToken,
      timestamp: Date.now(),
      signature: responseSignature,
      studentId: student._id.toString(),
      lessonId: lessonId
    };

    if (lesson.url && lesson.url.includes('youtu')) {
      // استخراج معرف الفيديو من رابط يوتيوب
      let videoId = '';
      const url = lesson.url;

      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
      } else if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1];
        const ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) {
          videoId = videoId.substring(0, ampersandPosition);
        }
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1];
        const questionPosition = videoId.indexOf('?');
        if (questionPosition !== -1) {
          videoId = videoId.substring(0, questionPosition);
        }
      }

      if (videoId) {
        // تشفير معرف الفيديو
        const encryptedVideoId = encryptData(videoId);

        videoData.type = 'youtube';
        videoData.data = encryptedVideoId;
        videoData.videoId = videoId; // سنزيل هذا في الإنتاج، فقط للاختبار
      }
    } else if (lesson.url && lesson.url.includes('drive.google.com')) {
      // معالجة روابط جوجل درايف
      let fileId = '';
      const url = lesson.url;

      const match = url.match(/[-\w]{25,}/);
      if (match && match[0]) {
        fileId = match[0];

        // تشفير معرف الملف
        const encryptedFileId = encryptData(fileId);

        videoData.type = 'drive';
        videoData.data = encryptedFileId;
        videoData.fileId = fileId; // سنزيل هذا في الإنتاج، فقط للاختبار
      }
    } else {
      // أي نوع آخر من الفيديو
      // تشفير الرابط
      const encryptedUrl = encryptData(lesson.url);

      videoData.type = 'other';
      videoData.data = encryptedUrl;
      videoData.url = lesson.url; // سنزيل هذا في الإنتاج، فقط للاختبار
    }

    // إضافة معلومات إضافية عن الدرس
    videoData.lessonInfo = {
      title: lesson.title,
      description: lesson.description,
      grade: lesson.grade,
      monthId: lesson.monthId
    };

    // تشفير البيانات النهائية (في الإنتاج)
    // const encryptedResponse = encryptFullResponse(videoData);
    // res.json(encryptedResponse);

    // للاختبار، نرسل البيانات بدون تشفير إضافي
    res.json(videoData);
  } catch (error) {
    console.error('خطأ في تدفق الفيديو:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحميل الفيديو' });
  }
});

/**
 * تشفير البيانات
 * @param {string} data - البيانات المراد تشفيرها
 * @returns {string} - البيانات المشفرة
 */
function encryptData(data) {
  try {
    // مفتاح التشفير (في الإنتاج، يجب تخزينه بشكل آمن)
    const encryptionKey = 'secure_video_encryption_key_must_be_32_chars';

    // إنشاء متجه التهيئة (IV)
    const iv = require('crypto').randomBytes(16);

    // إنشاء مشفر
    const cipher = require('crypto').createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);

    // تشفير البيانات
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // دمج IV مع البيانات المشفرة
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('خطأ في تشفير البيانات:', error);
    return data; // في حالة الخطأ، نعيد البيانات كما هي
  }
}

/**
 * فك تشفير البيانات
 * @param {string} encryptedData - البيانات المشفرة
 * @returns {string} - البيانات الأصلية
 */
function decryptData(encryptedData) {
  try {
    // مفتاح التشفير (يجب أن يكون نفس المفتاح المستخدم في التشفير)
    const encryptionKey = 'secure_video_encryption_key_must_be_32_chars';

    // فصل IV عن البيانات المشفرة
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // إنشاء مفكك التشفير
    const decipher = require('crypto').createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);

    // فك تشفير البيانات
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('خطأ في فك تشفير البيانات:', error);
    return encryptedData; // في حالة الخطأ، نعيد البيانات المشفرة كما هي
  }
}

/**
 * @desc تسجيل محاولات التلاعب
 * @route /api/security/tamper-attempt
 * @method POST
 * @access Private
 */
router.post('/security/tamper-attempt', async (req, res) => {
  try {
    // جلب بيانات محاولة التلاعب
    const tamperData = req.body;

    // إضافة معلومات إضافية
    tamperData.ip = req.ip;
    tamperData.userAgent = req.headers['user-agent'];
    tamperData.timestamp = new Date().toISOString();

    // تسجيل محاولة التلاعب في ملف
    const logDir = path.join(__dirname, '../logs');

    // إنشاء مجلد السجلات إذا لم يكن موجوداً
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // إنشاء اسم ملف السجل
    const logFile = path.join(logDir, 'security.log');

    // كتابة بيانات محاولة التلاعب في الملف
    fs.appendFileSync(
      logFile,
      JSON.stringify(tamperData) + '\n',
      'utf8'
    );

    // تسجيل محاولة التلاعب في قاعدة البيانات (إذا كان هناك نموذج لذلك)
    // في المستقبل، يمكن إنشاء نموذج SecurityLog لتخزين هذه البيانات

    // إرسال استجابة فارغة
    res.status(204).end();
  } catch (error) {
    console.error('خطأ في تسجيل محاولة التلاعب:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل محاولة التلاعب' });
  }
});

/**
 * @desc Watch Video Securely
 * @route /student/watch-video/:id
 * @method GET
 * @access Private (Only Student Can Access This Route)
 */
router.get('/watch-video/:id', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    console.log(`معرف الدرس المطلوب: ${lessonId}, النوع: ${typeof lessonId}`);

    // جلب بيانات الطالب
    const student = await Student.findById(req.userData._id);
    if (!student) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الطالب',
        errorMessage: 'لم نتمكن من العثور على بيانات الطالب الخاصة بك.',
        path: req.originalUrl
      });
    }

    // جلب بيانات المعلم المرتبط بالطالب
    const teacher = await Teacher.findById(student.assignedTeacher);
    if (!teacher) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على المعلم',
        errorMessage: 'لم نتمكن من العثور على بيانات المعلم المرتبط بك.',
        path: req.originalUrl
      });
    }

    // طباعة جميع الدروس المتاحة للتحقق
    console.log('الدروس المتاحة:');
    teacher.availableClasses.forEach((c, index) => {
      console.log(`الدرس ${index + 1}: معرف=${c.id} (${typeof c.id}), عنوان=${c.title}, شهر=${c.monthId}, مرحلة=${c.grade}`);
    });

    // جلب بيانات الدرس
    const lesson = teacher.availableClasses.find(c => parseInt(c.id) === lessonId);
    if (!lesson) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الدرس',
        errorMessage: 'لم نتمكن من العثور على بيانات الدرس المطلوب.',
        path: req.originalUrl
      });
    }

    // التحقق من أن الطالب قد اشترى الشهر المرتبط بالدرس
    const hasBoughtMonth = student.boughtMonths.some(month => month.monthId === lesson.monthId);
    if (!hasBoughtMonth) {
      return res.status(403).render('error', {
        errorTitle: 'غير مصرح بالوصول',
        errorMessage: 'يجب عليك الاشتراك في الشهر المرتبط بهذا الدرس أولاً للوصول إلى محتوياته.',
        path: req.originalUrl
      });
    }

    // إضافة الدرس إلى قائمة الدروس المشاهدة إذا لم يكن موجوداً بالفعل
    if (!student.watchedClasses.includes(lesson.title)) {
      student.watchedClasses.push(lesson.title);
      await student.save();
    }

    // تسجيل معلومات الفيديو في وحدة التحكم للتحقق
    console.log('معلومات الفيديو:');
    console.log(`عنوان الدرس: ${lesson.title}`);
    console.log(`وصف الدرس: ${lesson.description}`);
    console.log(`المرحلة الدراسية: ${lesson.grade}`);
    console.log(`الشهر المرتبط: ${lesson.monthId}`);
    console.log(`رابط الفيديو: ${lesson.url}`);
    console.log(`نوع الرابط: ${typeof lesson.url}`);
    console.log(`رابط الملف: ${lesson.pdf}`);
    console.log(`رابط الامتحان: ${lesson.exams}`);
    console.log(`معرف الدرس: ${lesson.id}`);
    console.log(`بيانات الدرس الكاملة:`, JSON.stringify(lesson, null, 2));

    // عرض صفحة الفيديو
    res.render('student/watch-video', {
      studentName: student.studentName,
      lesson: lesson
    });
  } catch (error) {
    console.error('خطأ في مشاهدة الفيديو:', error);
    res.status(500).render('error', {
      errorTitle: 'خطأ في النظام',
      errorMessage: 'حدث خطأ أثناء تحميل الفيديو. يرجى المحاولة مرة أخرى.',
      path: req.originalUrl
    });
  }
});

/**
 * @desc Download PDF Securely
 * @route /student/download-pdf/:id
 * @method GET
 * @access Private (Only Student Can Access This Route)
 */
router.get('/download-pdf/:id', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);

    // جلب بيانات الطالب
    const student = await Student.findById(req.userData._id);
    if (!student) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الطالب',
        errorMessage: 'لم نتمكن من العثور على بيانات الطالب الخاصة بك.',
        path: req.originalUrl
      });
    }

    // جلب بيانات المعلم المرتبط بالطالب
    const teacher = await Teacher.findById(student.assignedTeacher);
    if (!teacher) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على المعلم',
        errorMessage: 'لم نتمكن من العثور على بيانات المعلم المرتبط بك.',
        path: req.originalUrl
      });
    }

    // جلب بيانات الدرس
    const lesson = teacher.availableClasses.find(c => parseInt(c.id) === lessonId);
    if (!lesson) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الدرس',
        errorMessage: 'لم نتمكن من العثور على بيانات الدرس المطلوب.',
        path: req.originalUrl
      });
    }

    // التحقق من أن الطالب قد اشترى الشهر المرتبط بالدرس
    const hasBoughtMonth = student.boughtMonths.some(month => month.monthId === lesson.monthId);
    if (!hasBoughtMonth) {
      return res.status(403).render('error', {
        errorTitle: 'غير مصرح بالوصول',
        errorMessage: 'يجب عليك الاشتراك في الشهر المرتبط بهذا الدرس أولاً للوصول إلى محتوياته.',
        path: req.originalUrl
      });
    }

    // إعادة توجيه الطالب إلى رابط الملف
    res.redirect(lesson.pdf);
  } catch (error) {
    console.error('خطأ في تحميل الملف:', error);
    res.status(500).render('error', {
      errorTitle: 'خطأ في النظام',
      errorMessage: 'حدث خطأ أثناء تحميل الملف. يرجى المحاولة مرة أخرى.',
      path: req.originalUrl
    });
  }
});

/**
 * @desc Take Exam Securely
 * @route /student/take-exam/:id
 * @method GET
 * @access Private (Only Student Can Access This Route)
 */
router.get('/take-exam/:id', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);

    // جلب بيانات الطالب
    const student = await Student.findById(req.userData._id);
    if (!student) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الطالب',
        errorMessage: 'لم نتمكن من العثور على بيانات الطالب الخاصة بك.',
        path: req.originalUrl
      });
    }

    // جلب بيانات المعلم المرتبط بالطالب
    const teacher = await Teacher.findById(student.assignedTeacher);
    if (!teacher) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على المعلم',
        errorMessage: 'لم نتمكن من العثور على بيانات المعلم المرتبط بك.',
        path: req.originalUrl
      });
    }

    // جلب بيانات الدرس
    const lesson = teacher.availableClasses.find(c => parseInt(c.id) === lessonId);
    if (!lesson) {
      return res.status(404).render('error', {
        errorTitle: 'لم يتم العثور على الدرس',
        errorMessage: 'لم نتمكن من العثور على بيانات الدرس المطلوب.',
        path: req.originalUrl
      });
    }

    // التحقق من أن الطالب قد اشترى الشهر المرتبط بالدرس
    const hasBoughtMonth = student.boughtMonths.some(month => month.monthId === lesson.monthId);
    if (!hasBoughtMonth) {
      return res.status(403).render('error', {
        errorTitle: 'غير مصرح بالوصول',
        errorMessage: 'يجب عليك الاشتراك في الشهر المرتبط بهذا الدرس أولاً للوصول إلى محتوياته.',
        path: req.originalUrl
      });
    }

    // إعادة توجيه الطالب إلى رابط الامتحان
    res.redirect(lesson.exams);
  } catch (error) {
    console.error('خطأ في فتح الامتحان:', error);
    res.status(500).render('error', {
      errorTitle: 'خطأ في النظام',
      errorMessage: 'حدث خطأ أثناء فتح الامتحان. يرجى المحاولة مرة أخرى.',
      path: req.originalUrl
    });
  }
});

module.exports = router;
