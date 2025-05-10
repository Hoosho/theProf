const express = require('express');
const router = express.Router();

// /
router.get('', ( req, res ) => {
    res.render('welcome-page')
})
    
module.exports = router;
