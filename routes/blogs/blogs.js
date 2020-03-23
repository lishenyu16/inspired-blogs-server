const express = require('express');
const router = express.Router();
const pool = require('../../db/index');
const isAuthMiddleware = require('./../middleware/isAuth');

router.post('/addBlog', isAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    const blogTitle = req.body.blogTitle;
    const blogContent = req.body.blogContent;
    try {
        const addBlogSql = `insert into blogs (user_id, blog_title, blog_content, created_on) values ($1,$2,$3,current_timestamp)`;
        const result = pool.query(addBlogSql, [userId, blogTitle, blogContent]);
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

module.exports = router;


