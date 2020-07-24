const axios = require('./iex');
const isAuthMiddleware = require('./../middleware/isAuth');
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

router.get('/fetch_market_quotes', isAuthMiddleware, async (req, res) => { //
    try {
        const symbols = `aal,bac,intc,amd,mrna,nio,dal,ba`;
        const result = await axios.get(`/market/batch?symbols=${symbols}&types=quote&token=${process.env.IEXCLOUD_SECRET_KEY}`);
        res.status(200).json({
            success: true,
            data: result.data,
        })
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            success: false,
            message: err
        })
    }
})

router.get('/stocks/:symbol', async (req, res) => {
    try { 
        const symbol = req.params.symbol;
        if (!symbol){
            res.status(400).json({
                success: false,
                message: 'A valid stock symbol is required.'
            })
        }
        const result = await axios.get(`/${symbol}/batch?types=quote,news,chart&token=${process.env.IEXCLOUD_SECRET_KEY}`);
        res.status(200).json({
            success: true,
            data: result.data,
        })
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            success: false,
            message: err
        })
    }
})

module.exports = router;

