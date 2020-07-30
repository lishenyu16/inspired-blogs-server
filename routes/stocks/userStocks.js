const axios = require('./iex');
const isAuthMiddleware = require('./../middleware/isAuth');
const express = require('express');
const pool = require('../../db/index');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

router.get('/fetch_user_stocks', isAuthMiddleware, async (req, res) => {
    try {
        let userId = req.userId;
        const queryBuyingPower = `
            select buying_power from stock_accounts where user_id = :userId 
        `;
        const queryUserStocks = `
            select * from user_stocks where user_id = :userId`;
        const result1 = await pool.query(queryBuyingPower, [userId]);
        const result2 = await pool.query(queryUserStocks, [userId]);
        res.status(200).json({
            success: true,
            buyingPower: result1.rows[0].buying_power,
            stocks: result2.rows,
        })

    }
    catch(err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err
        })
    }
})

router.post('/sell_stocks', isAuthMiddleware, async ( req, res) => {
    try {
        const userId = req.userId;

    }
    catch(err){

    }
})

router.post('/buy_stocks', async (req, res)=>{
    try {
        const userId = req.userId;
        const symbol = req.body.symbol;
        const amount = req.body.amount;
        if (!symbol || !amount){
            return res.status(400).json({
                success: false,
                message: 'Symbol or amount is not specified.'
            })
        }
        const queryBuyingPower = `select buying_power from stock_accounts where user_id = $1`;
        const queryUserStock = `select * from user_stocks where user_id = $1 and symbol = $2`;
        const buyExisting = `
        UPDATE user_stocks 
        SET amount = :$1 and average_price = $2
        `;
        const buyNewStock = `
        INSERT INTO 
            user_stocks (user_id,symbol,amount,average_price) 
        VALUES($1,$2,$3,$4) 
        ON CONFLICT (user_id,symbol) 
        DO 
           UPDATE SET amount = $5 AND average_price = $6;`
        const resultPower = await pool.query(queryBuyingPower, [userId]);
        const userStock = await pool.query(queryUserStock, [userId,symbol]);
        const price = await axios.get(`/${symbol}/book?token=${process.env.IEXCLOUD_SECRET_KEY}`);
        console.log('stock price:', price.data.quote.latestPrice);
        if (resultPower.rows[0].buying_power >= price.data.quote.latestPrice*amount){
            // does this user have this stock?
            if (userStock.rows.find(item=>item.symbol == symbol&&item.amount>0)){
                // execute the purchase
                let existingStock = userStock.rows[0];
                let newAmount = amount+existingStock.amount;
                let newAverage = (price.data.quote.latestPrice*amount + existingStock.average_price*existingStock.amount)/(existingStock.amount+amount);
                await pool.query(buyExisting, [userId,symbol, newAmount, newAverage]);
            }
            else {
                await pool.query(buyNewStock, [userId,symbol, amount, price.data.quote.latestPrice,amount, price.data.quote.latestPrice]);
            }
        } 
        else {
            res.status(400).json({
                success: false,
                message: 'No enough buying power.'
            })
        }  
    }
    catch(err){
        console.log(err);
        res.status(500).json()
    }
})
module.exports = router;