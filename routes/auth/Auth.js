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
                        message: 'Password does not match.'
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
            accounts(username,password,email,created_on,is_admin,is_email_confirmed,hash,hash_expiration_date)
        values($1,$2,$3,$4,false,false,$5,$6)`;
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
            await pool.query(queryInsert,[username,pw_hash,email,new Date(),verificationHash,new Date().getTime()+10*60*1000]);
            transporter.sendMail({
                to: email,
                from: 'inspiredblogs@gmail.com',
                subject: 'Signup succeeded!',
                html: `<h1>Please verify your email by clicking on the following link:</h1>
                        <div style="width:100%;text-align:center;">
                            <a style="padding:5px;background-color:cyan;text-decoration:none" href="http://shenyu16.com/confirmEmail/${verificationCode}/${email.toLowerCase()}">Confirm Email Address</a>
                        </div>`
            })
            .then(re=>{
                console.log(re);
                res.status(200).json({
                    success: true,
                    message: 'Sign up successfully, need to verify email address'
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
        let email = req.params.email;
        let verificaitonCode = req.params.verificaitonCode;
        let pendinguser_sql = `select * from accounts where email = $1`;
        let confirmedEmail_sql = `update accounts set is_email_confirmed = true where email = $1`;
        const result = await pool.query(pendinguser_sql,[email]);
        if (result.rows.length > 0){
            let user = result.rows[0];
            let hashedCode = user.hash;
            let hashExpirationTime = user.hash_expiration_date;
            let currentTime = new Date().getTime();
            if (currentTime <= hashExpirationTime){
                bcrypt.compare(verificaitonCode, hashedCode)
                .then(async domatch=>{
                    if (domatch){
                        await pool.query(confirmedEmail_sql,[email]);
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
                })
                .catch(err=>{
                    return res.status(500).json({
                        success: false,
                        message: 'Something wrong happeded to our server.'
                    })
                })
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