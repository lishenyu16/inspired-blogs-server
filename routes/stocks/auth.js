const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db/index');
const winston = require('winston');
const router = express.Router();

function jwtSignUser (user) {
    return jwt.sign(user, 'somereallylongsecret'), {
        expiresIn: '120h'
    }
}

router.post('/signUp', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const saltRounds = 10;
    try {
        const queryExisting = `select * from stock_accounts where username = $1`;
        const queryInsert = `insert into stock_accounts(username, password, created_on, last_login) values ($1, $2, $3, $4)`;
        const result = await pool.query(queryExisting, [username]);
        if (result.rows.length>0){
            res.status(200).json({
                success:false,
                message: 'Username already exists'
            })
        }
        else {
            const pw_hash = await bcrypt.hash(password, saltRounds);
            const result_insert = await pool.query(queryInsert, [username, pw_hash, new Date(), null]);
            console.log('there')
            res.status(200).json({
                succes: true,
                message: 'Successfully registered.'
            })
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            success : false,
            message: 'Failed to sign up, please try again later or contact our admin for support.'
        })
    }
})

router.post('/signIn', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    try {

    }
    catch(err){
        
    }
})

module.exports = router