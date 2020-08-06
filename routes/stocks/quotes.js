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

router.get('/stocks/:symbol', isAuthMiddleware, async (req, res) => {
    try { 
        const symbol = req.params.symbol;
        if (!symbol){
            res.status(400).json({
                success: false,
                message: 'A valid stock symbol is required.'
            })
        }
        const result = await axios.get(`/${symbol}/batch?types=quote,news&token=${process.env.IEXCLOUD_SECRET_KEY}`);
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

router.get('/chart/:symbol/:range/:chartInterval', isAuthMiddleware, async (req, res) => {
    try {
        const range = req.params.range||null;
        const symbol = req.params.symbol;
        const chartInterval = req.params.chartInterval||null;
        if (!symbol){
            res.status(400).json({
                success: false,
                message: 'A valid stock symbol is required.'
            })
        }
        // /twtr/chart?range=1d&chartInterval=5&token=sk_2b711af202a64e1287a1f57bb6a15908
        const result = await axios.get(`/${symbol}/chart?range=${range}&chartInterval=${chartInterval}&token=${process.env.IEXCLOUD_SECRET_KEY}`);
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

