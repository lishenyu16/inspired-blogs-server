const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../../db/index');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const isAuthMiddleware = require('./../middleware/isAuth');
const router = express.Router();
const uuid = require('uuid/v4');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
        // api_user: '',
        api_key:'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'
    }
}))
function jwtSignUser (user) {
    return jwt.sign(user, 'somereallylongsecret', {
        expiresIn: '24h'
    })
}
router.post('/signIn', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    try {
        const query = `select * from accounts where email = $1`;
        const lastLoginSql = `update accounts set last_login = current_timestamp where email = $1`;
        const result = await pool.query(query,[email]);
        if (result.rows.length > 0){
            let user = result.rows[0];
            if (!user.is_email_confirmed){
                if (user.hash_expiration_time <= new Date().getTime()){
                    //expired, resend confirmation email
                }
                else {
                    return res.status(401).json({
                        success: false,
                        message: 'A confirmation email has been resent to your email, please check your inbox as well as your spam folder.',
                    })
                }
            }
            const encryptedPw = user.password;
            bcrypt.compare(password, encryptedPw)
            .then( async domatch=>{
                if (domatch){
                    await pool.query(lastLoginSql,[email]);
                    const token = jwtSignUser({
                        userId: user.user_id,
                        email: user.email,
                    })
                    res.status(200).json({
                        success: true,
                        token: token,
                        expirationTime: new Date().getTime() + 1000*60*60*24, //expired 24h later
                        userId: user.user_id,
                        email: user.email,
                        username: user.username,
                        isAdmin: user.is_admin,
                    })
                }
                else {
                    res.status(200).json({
                        success: false,
                        message: 'Incorrect password.'
                    })
                }
            })
            .catch(err=>{
                console.log(err);
                res.status(400).json({
                    success: false,
                    message: 'Server encountered an error, please try again later or contact our support for help.'
                })
            })
        }
        else {
            res.status(200).json({
                success: false,
                message: 'Email not found.'
            })
        }
    }
    catch(e) {
        res.status(400).json({
            success: false,
            message: 'Server encountered an error, please try again later or contact our support for help.'
        })
    }
})

router.post('/signUp', async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const saltRounds = 10;
    try {
        const queryExiting = `select * from accounts where email = $1`;
        const queryInsert = `
        insert into 
            accounts(username,password,email,created_on,is_admin,is_email_confirmed,hash,hash_expiration_time)
        values($1,$2,$3,$4,false,false,$5,$6) returning user_id`;
        const result = await pool.query(queryExiting,[email]);
        if (result.rows.length > 0){
            res.status(200).json({
                success: false,
                message: 'Email already exists.'
            })
        }
        else {
            const pw_hash = await bcrypt.hash(password, saltRounds);
            let verificationCode = uuid();
            const verificationHash = await bcrypt.hash(verificationCode, saltRounds);
            const result_userId = await pool.query(queryInsert,[username,pw_hash,email,new Date(),verificationHash,new Date().getTime()+24*60*60*1000]);
            transporter.sendMail({
                to: email,
                from: 'inspiredblogs@gmail.com',
                subject: 'Inspired Blogs Email Confirmation',
                html: process.env.NODE_ENV === "production"?
                    `<h1>Please verify your email by clicking on the following link:</h1>
                    <div style="width:100%;text-align:center;">
                        <a style="padding:5px;background-color:cyan;text-decoration:none" 
                        href="http://shenyu16.com/confirmEmail/${verificationCode}/${result_userId.rows[0].user_id}">Confirm Email Address</a>
                    </div>`
                    :
                    `<h1>Please verify your email by clicking on the following link:</h1>
                    <div style="width:100%;text-align:center;">
                        <a style="padding:5px;background-color:cyan;text-decoration:none" 
                        href="http://localhost:8080/confirmEmail/${verificationCode}/${result_userId.rows[0].user_id}">Confirm Email Address</a>
                    </div>`
            })
            .then(re=>{
                console.log(re);
                res.status(200).json({
                    success: true,
                    message: 'Sign up successfully, need to verify email address'
                })
            })
            .catch(err=>{
                console.log(err);
                res.status(400).json({
                    success: false,
                    message: 'Something wrong happened to our server'
                })
            })
        }
    }
    catch(e) {
        console.log(e);
        res.status(400).json({
            success: false,
            message: 'Failed to sign up, please contact admin for help!'
        })
    }
})

router.post('/confirmEmail', async (req, res) =>{
    try {
        let userId = req.body.userId;
        let verificationCode = req.body.verificationCode;
        let pendinguser_sql = `select * from accounts where user_id = $1`;
        let confirmedEmail_sql = `update accounts set is_email_confirmed = true where user_id = $1`;
        const result = await pool.query(pendinguser_sql,[userId]);
        if (result.rows.length > 0){
            let user = result.rows[0];
            let hashedCode = user.hash;
            let hashExpirationTime = user.hash_expiration_time;
            let currentTime = new Date().getTime();
            if (currentTime <= hashExpirationTime){
                const match = await bcrypt.compare(verificationCode, hashedCode);
                if (match){
                    await pool.query(confirmedEmail_sql,[userId]);
                    return res.status(200).json({
                        success: true,
                        message: 'successfully verified email'
                    })
                }
                else {
                    return res.status(401).json({
                       success: false,
                       message: 'Failed to verify email token: invalid verification token was submitted.'     
                    })
                }
            }
            else {
                return res.status(401).json({
                    success: false,
                    message: 'verificaton code expired'
                })
            }
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Email not found.'
            })
        }
    }
    catch(err){
        console.log(err);
        return res.status(400).json({
            success: false,
            message: err
        })
    }
})
router.post('/forgotPassword', async (req, res) => {
    try {
        const email = req.body.email;
        const saltRounds = 10;
        const queryExiting = `select * from accounts where email = $1`;
        const queryUpdateHash = `update accounts set hash = $1, hash_expiration_time = $2 where email = $3`;
        const result = await pool.query(queryExiting,[email]);
        if (result.rows.length == 0){
            res.status(200).json({
                success: false,
                message: 'Email not found.'
            })
        }
        else {
            let verificationCode = uuid();
            const verificationHash = await bcrypt.hash(verificationCode, saltRounds);
            const result_userId = await pool.query(queryUpdateHash,[verificationHash,new Date().getTime()+24*60*60*1000, email]);
            transporter.sendMail({
                to: email,
                from: 'inspiredblogs@gmail.com',
                subject: 'Inspired Blogs Reset Password',
                html: process.env.NODE_ENV === "production"?
                    `<h1>Please verify your email by clicking on the following link:</h1>
                    <div style="width:100%;text-align:center;">
                        <a style="padding:5px;background-color:cyan;text-decoration:none" 
                        href="http://shenyu16.com/resetPassword/${verificationCode}/${result.rows[0].user_id}">Confirm Email Address</a>
                    </div>
                    <div style="width:100%;text-align:center;">
                        or copy this link to your browser: <b>http://shenyu16.com/resetPassword/${verificationCode}/${result.rows[0].user_id}</b>
                    </div>
                    `
                    :
                    `<h1>Please verify your email by clicking on the following link:</h1>
                    <div style="width:100%;text-align:center;">
                        <a style="padding:5px;background-color:cyan;text-decoration:none" 
                        href="http://localhost:8080/resetPassword/${verificationCode}/${result.rows[0].user_id}">Confirm Email Address</a>
                    </div>
                    <div style="width:100%;text-align:center;">
                        or copy this link to your browser: <b>http://localhost:8080/resetPassword/${verificationCode}/${result.rows[0].user_id}</b>
                    </div>
                    `
            })
            .then(re=>{
                console.log(re);
                res.status(200).json({
                    success: true,
                    message: 'Email sent, check inbox link'
                })
            })
            .catch(err=>{
                console.log(err);
                res.status(400).json({
                    success: false,
                    message: 'Something wrong happened to our server'
                })
            })
        }
    }
    catch(e){
        console.log(e);
        res.status(400).json({
            success: false,
            message: 'Failed to sign up, please contact admin for help!'
        })
    }
})
router.post('/resetPassword', async (req, res) => {
    try {
        let verificationCode = req.body.verificationCode;
        let userId = req.body.userId;
        let password = req.body.password;
        let pendinguser_sql = `select * from accounts where user_id = $1`;
        let updatePw_sql = `update accounts set password = $1 where user_id = $2`;
        const result = await pool.query(pendinguser_sql,[userId]);
        if (result.rows.length > 0){
            let user = result.rows[0];
            let hashedCode = user.hash;
            let hashExpirationTime = user.hash_expiration_time;
            let currentTime = new Date().getTime();
            if (currentTime <= hashExpirationTime){
                const match = await bcrypt.compare(verificationCode, hashedCode);
                if (match){
                    await pool.query(updatePw_sql,[password,userId]);
                    return res.status(200).json({
                        success: true,
                        message: 'successfully updated password'
                    })
                }
                else {
                    return res.status(401).json({
                       success: false,
                       message: 'Failed to verify email token: invalid verification token was submitted.'     
                    })
                }
            }
            else {
                return res.status(401).json({
                    success: false,
                    message: 'verificaton code expired'
                })
            }
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'User not found.'
            })
        }
    }
    catch(err){
        console.log(err);
        return res.status(400).json({
            success: false,
            message: err
        })
    }
})
router.post('/updateProfile', isAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    const username = req.body.username;
    try {
        const updateSql = `update accounts set username = $1 where user_id = $2 returning username`;
        const result = await pool.query(updateSql, [username,userId]);
        res.status(200).json({
            success: true,
            message: 'Successfully updates profile',
            username: result.rows[0].username,
        })
    }
    catch(err){
        console.log(err);
        res.status(400).json({
            success: false,
            message: 'Failed to update profile, error: ' + err
        })
    }
})

module.exports = router;