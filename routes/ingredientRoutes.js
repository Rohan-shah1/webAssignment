const express = require('express');
const router = express.Router();

const { normalizeIngredientsAi } = require('../controllers/ingredientController');

router.post('/normalize', normalizeIngredientsAi);

module.exports = router;
