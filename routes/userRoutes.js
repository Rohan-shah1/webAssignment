const express = require('express');
const router = express.Router();
const { getChefs, getChefById } = require('../controllers/userController');

router.get('/chefs', getChefs);
router.get('/chefs/:id', getChefById);

module.exports = router;
