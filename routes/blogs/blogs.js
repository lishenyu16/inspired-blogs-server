const express = require('express');
const router = express.Router();
const pool = require('../../db/index');
const isAuthMiddleware = require('./../middleware/isAuth');
const jwt = require('jsonwebtoken');

router.post('/addBlog', isAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    const blogTitle = req.body.blogTitle;
    const blogContent = req.body.blogContent;
    try {
        const addBlogSql = `insert into blogs (user_id, blog_title, blog_content, created_on) values ($1,$2,$3,current_timestamp)`;
        const result = await pool.query(addBlogSql, [userId, blogTitle, blogContent]);
        res.status(200).json({
            success: true,
            message: 'Successfully created a blog!'
        })
    }
    catch(err){
        console.log(err);
        res.statusCode(400).json({
            success: false,
            message: 'Failed to add a blog: ' + err
        })
    }
})
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

router.get('/fetchBlogs', async (req,res) => {
    try {
        const query = `select b.*, a.username from blogs b inner join accounts a on b.user_id = a.user_id where b.is_private = false`;
        const result = await pool.query(query);
        res.status(200).json({
            success: true,
            blogs: result.rows
        })
    }
    catch(err) {
        res.status(400).json({
            success: false,
            message: 'failed to fetch blogs'
        })
    }
})

router.get('/blogDetail/:blog_id', async (req,res) => {
    try {
        let blog_id = req.params.blog_id;
        if (isNaN(blog_id) || blog_id < 0){
            return res.status(400).json({
                success:false,
                message:'Invalid blog id provided: ' + blog_id,
            })
        }
        const authHeader = req.get('Authorization');
        if(!authHeader){
            // return blog that is not private
            const query_notPrivate = `select b.*, a.username from blogs b inner join accounts a on b.user_id = a.user_id where b.blog_id = $1 and b.is_private = false`;
            const result = await pool.query(query_notPrivate,[blog_id]);
            if (result.rows.length>0){
                return res.status(200).json({
                    success: true,
                    blog: result.rows[0]
                })
            }
            else {
                return res.status(200).json({
                    success: false,
                    message: 'Blog not found'
                })
            }
        }
        else {
            let sql = `select b.*, a.username from blogs b inner join accounts a on b.user_id = a.user_id 
            where b.blog_id = $1 
            and 
            (b.is_private = false or (b.is_private = true and b.user_id = $2))`;
            const token = authHeader.split(' ')[1];
            decodeToken = jwt.verify(token, 'somereallylongsecret');
            let userId = decodeToken.userId;
            const result = await pool.query(sql,[blog_id,userId]);
            if (result.rows.length>0){
                return res.status(200).json({
                    success: true,
                    blog: result.rows[0]
                })
            }
            else {
                return res.status(200).json({
                    success: false,
                    message: 'Blog not found'
                })
            }
        }
    }
    catch(err) {
        console.log(err);
        res.status(400).json({
            success: false,
            message: 'Failed to fetch blog, server issue'
        })
    }
})

module.exports = router;


