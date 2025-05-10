// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// التحقق من وجود التوكن وصلاحيته
exports.protect = (req, res, next) => {
  const token = req.cookies['accessToken']; // جلب التوكن من الكوكيز

  if (!token) {
    return res.redirect('/auth/login');
  }

  try {
    // فك التوكن والتحقق منه
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded; // وضع معلومات المستخدم في الريكويست
    next();
  } catch (err) {
    res.clearCookie('accessToken');
    return res.redirect('/auth/login');
  }
};

// التحقق من دور المستخدم (معلم)
exports.restrictToTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    return res.status(403).render('error', {
      errorTitle: 'غير مصرح',
      errorMessage: 'ليس لديك صلاحية للوصول إلى هذه الصفحة. هذه الصفحة للمعلمين فقط.'
    });
  }
};

// التحقق من دور المستخدم (طالب)
exports.restrictToStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).render('error', {
      errorTitle: 'غير مصرح',
      errorMessage: 'ليس لديك صلاحية للوصول إلى هذه الصفحة. هذه الصفحة للطلاب فقط.'
    });
  }
};

// جلب بيانات المستخدم من قاعدة البيانات
exports.getUserData = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user.id);
      if (!teacher) {
        res.clearCookie('accessToken');
        return res.redirect('/auth/login');
      }
      req.userData = teacher;
    } else if (req.user.role === 'student') {
      const student = await Student.findById(req.user.id);
      if (!student) {
        res.clearCookie('accessToken');
        return res.redirect('/auth/login');
      }
      req.userData = student;
    }

    next();
  } catch (err) {
    console.error('خطأ في جلب بيانات المستخدم:', err);
    return res.status(500).render('error', {
      errorTitle: 'خطأ في الخادم',
      errorMessage: 'حدث خطأ أثناء جلب بيانات المستخدم. يرجى المحاولة مرة أخرى.'
    });
  }
};






// const jwt = require('jsonwebtoken');
// const { Student } = require('../models/Student');
// const { Teacher } = require('../models/Teacher');

// module.exports.protect = async (req, res, next) => {
//     let token;
//     if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
//         try{
//             // Get The Token From The Header
//             token = req.headers.authorization.split(' ')[1];
//             const decoded = jwt.verify(token, process.env.SECRET_KEY);

//             // Verify The Token
//             if(decoded.role === 'student'){
//                 const student = await Student.findById(decoded.id);
//                 if(!student || student.codeStatus === 'Expired'){
//                     return res.status(401).json({
//                         errorMessage : 'You Are Not Authorized To Continue!'
//                      });
//                 }
//                 req.user = student;
//             }else if(decoded.role === 'teacher'){
//                 const teacher = await Teacher.findById(decoded.id);
//                 if(!teacher){
//                     return res.status(401).json({
//                         errorMessage : 'You Are Not Authorized To Continue!'
//                     });
//                 }
//                 req.user = teacher;
//                 next();
//             }
//         }catch(err){
//             return res.status(401).json({
//                 errorMessage : 'Invalid Or Expired Token!'
//             })
//         }if(!token){
//             res.status(401).json({
//                 errorMessage : 'No Token Provided!'
//             })
//         }


//     }
// };

