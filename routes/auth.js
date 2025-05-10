// routes/auth.js
const express = require('express');
const router = express.Router();
const { renderLoginPage, studentLogin, getTestIds } = require('../controllers/authController');

// تحديد المسارات بشكل صحيح
router.route('/login')
    .get(renderLoginPage)
    .post(studentLogin);

// مسار لجلب أكواد الاختبار
router.get('/test-ids', getTestIds);

// مسار لتسجيل الخروج
router.get('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.redirect('/');
});

module.exports = router;
