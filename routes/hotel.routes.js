const express = require('express');
const router = express.Router();
const { importHotels, getHotels, testAPI } = require('../controllers/hotel.controller');

console.log('Setting up hotel routes');

router.get('/test-api', testAPI);
router.get('/hotels', getHotels);

router.post('/import-hotels', importHotels);
router.post('/import-hotels/:city', importHotels);

module.exports = router;