// routes/auth.js
const express = require('express');
const router = express.Router();
const { renderLoginPage, login } = require('../controllers/authController');

// تحديد المسارات بشكل صحيح
router.route('/login')
    .get(renderLoginPage)
    .post(login);

// مسار لتسجيل الخروج
router.get('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.redirect('/');
});

module.exports = router;
