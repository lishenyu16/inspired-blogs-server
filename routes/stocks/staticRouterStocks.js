const express = require('express');
const path = require('path');
const router = express.Router();
const appRoot = require('app-root-path');

router.get('/*', async (req,res) => {
    console.log('ip:', req.ip);
    res.sendFile(path.join(`${appRoot}/views/stocktrader`, 'index.html'));
})

module.exports = router;