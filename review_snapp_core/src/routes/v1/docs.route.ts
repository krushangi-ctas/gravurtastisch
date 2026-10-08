const express = require('express');

const router = express.Router();

// Add your routes here
router.get('/', (req, res) => {
  res.send('Welcome to the API');
});

// Include more routes as required

module.exports = router;
