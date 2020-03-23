const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../../db/index');
const jwt = require('jsonwebtoken')
const isAuthMiddleware = require('./../middleware/isAuth');
const router = express.Router();

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
            accounts(username,password,email,created_on,is_admin)
        values($1,$2,$3,$4,false)`;
        const result = await pool.query(queryExiting,[email]);
        if (result.rows.length > 0){
            res.status(200).json({
                success: false,
                message: 'Email already exists.'
            })
        }
        else {
            const hash = await bcrypt.hash(password, saltRounds);
            await pool.query(queryInsert,[username,hash,email,new Date()]);
            res.status(200).json({
                success: true,
                message: 'Sign up successfully!'
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