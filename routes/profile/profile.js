const express = require('express');
const router = express.Router();
const pool = require('../../db/index');
const isAuthMiddleware = require('./../middleware/isAuth');
const jwt = require('jsonwebtoken');

router.post('/editBlog', isAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    const blogId = req.body.blogId;
    const blogTitle = req.body.blogTitle;
    const blogContent = req.body.blogContent;
    try {
        const findBlogSql = `select * from blogs where blog_id = $1`;
        const newBlogSql = `select b.*, a.username from blogs b inner join accounts a on b.user_id = a.user_id where blog_id = $1`;
        const updateSql = `
        update 
            blogs 
        set 
            blog_title = $1, 
            blog_content = $2, 
            last_edited_on = current_timestamp 
        where 
            blog_id = $3
        returning *`;
        const blog = await pool.query(findBlogSql, [blogId]);
        if (blog.rows[0].user_id == userId){
            await pool.query(updateSql, [blogTitle, blogContent, blogId]);
            const result2 = await pool.query(newBlogSql, [blogId]);
            res.status(200).json({
                success: true,
                blog: result2.rows[0],
                message: 'Successfully edited this blog.'
            })
        }
        else {
            res.status(401).json({
                success: false,
                message: 'You have no authorization to edit this blog'
            })
        }
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
            const result = await pool.query(query_targetProfile, [targetId]);
            if (result.rows.length>0){
                return res.status(200).json({
                    success: true,
                    data: result.rows[0],
                    isSelf: false
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


