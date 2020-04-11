const express = require('express');
const router = express.Router();
const pool = require('../../db/index');
const isAuthMiddleware = require('./../middleware/isAuth');

router.post('/updateProfile', isAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    const username = req.body.username;
    const publicInfo = req.body.publicInfo;
    try {
        const insertsql = `update accounts set username = $1, public_info = $2 where user_id = $3`;
        await pool.query(insertsql, [username, publicInfo, userId]);
        return res.status(200).json({
            success: true,
            publicInfo,
            username,
            message: 'successfully updated profile.'
        })
    }
    catch(err){
        console.log(err);
        res.statusCode(400).json({
            success: false,
            message: 'Failed to edit this blog: ' + err
        })
    }
})

router.get('/getProfile/:targetId', isAuthMiddleware, async (req,res) => {
    try {
        let userId = req.userId; // current signing in user
        let targetId = req.params.targetId; // user to be viewing, may be someone else
        if (isNaN(targetId) || targetId < 0){
            return res.status(400).json({
                success: false,
                message: 'User not found: ' + targetId,
            })
        }
        if (userId != targetId){
            // return blog that is not private
            const query_targetProfile = `select username, public_info, created_on from accounts where user_id = $1`;
            let sql_blogs = `select * from blogs where user_id = $1 and is_private = false`;
            const result_profile = await pool.query(query_targetProfile, [targetId]);
            const result_blogs = await pool.query(sql_blogs, [targetId]);
            if (result_profile.rows.length>0){
                return res.status(200).json({
                    success: true,
                    profileData: result_profile.rows[0],
                    blogsData: result_blogs.rows,
                    isSelf: false,
                })
            }
            else {
                return res.status(200).json({
                    success: false,
                    message: 'User not found'
                })
            }
        }
        else {
            let sql_profile = `
            select 
                username, email, created_on, is_admin, public_info
            from 
                accounts
            where 
                user_id = $1`;
            let sql_blogs = `select * from blogs where user_id = $1`;
            const result_profile = await pool.query(sql_profile, [userId]);
            const result_blogs = await pool.query(sql_blogs, [userId]);
            if (result_profile.rows.length>0){
                return res.status(200).json({
                    success: true,
                    profileData: result_profile.rows[0],
                    blogsData: result_blogs.rows,
                    isSelf: true
                })
            }
            else {
                return res.status(200).json({
                    success: false,
                    message: 'User not found'
                })
            }
        }
    }
    catch(err) {
        console.log(err);
        res.status(400).json({
            success: false,
            message: 'Failed to fetch profile, server issue'
        })
    }
})

module.exports = router;


