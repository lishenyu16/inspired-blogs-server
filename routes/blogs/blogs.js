const express = require('express');
const router = express.Router();
const pool = require('../../db/index');
const isAuthMiddleware = require('./../middleware/isAuth');
const jwt = require('jsonwebtoken');

router.post('/addBlog', isAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    const blogTitle = req.body.blogTitle;
    const blogContent = req.body.blogContent;
    const blogCategory = req.body.blogCategory;

    try {
        const addBlogSql = `
        insert into 
            blogs (user_id, blog_title, blog_content, created_on, category_id, views) 
            values ($1,$2,$3,current_timestamp, $4, 0)`;
        const result = await pool.query(addBlogSql, [userId, blogTitle, blogContent, blogCategory]);
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
    const blogCategory = req.body.blogCategory;
    try {
        const findBlogSql = `select * from blogs where blog_id = $1`;
        const newBlogSql = `select b.*, a.username from blogs b inner join accounts a on b.user_id = a.user_id where blog_id = $1`;
        const updateSql = `
        update 
            blogs 
        set 
            blog_title = $1, 
            blog_content = $2, 
            category_id = $3,
            last_edited_on = current_timestamp 
        where 
            blog_id = $4
        returning *`;
        const blog = await pool.query(findBlogSql, [blogId]);
        if (blog.rows[0].user_id == userId){
            await pool.query(updateSql, [blogTitle, blogContent,blogCategory, blogId]);
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
        const query = `
        select 
            b.*, a.username, c.description
        from 
            blogs b 
        inner join 
            accounts a 
        on 
            b.user_id = a.user_id 
        left join
            categories c
        on
            b.category_id = c.category_id
        where 
            b.is_private = false 
        order by 
            b.blog_id desc`;
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

router.get('/blogDetail/:blog_id/:increaseCount', async (req,res) => {
    try {
        let blog_id = req.params.blog_id;
        let increaseCount = req.params.increaseCount;
        if (isNaN(blog_id) || blog_id < 0){
            return res.status(400).json({
                success:false,
                message:'Invalid blog id provided: ' + blog_id,
            })
        }
        if (increaseCount=='true'){
            let viewsCount = `update blogs set views = views + 1 where blog_id = $1 returning views`;
            let re = await pool.query(viewsCount, [blog_id]);
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
        if (err.name=='TokenExpiredError'){
            return res.status(400).json({
                success: false,
                message: 'jwt expired.'
            })
        }
        console.log(err);
        res.status(400).json({
            success: false,
            message: 'Failed to fetch blog, server issue'
        })
    }
})

router.post('/deleteBlog', isAuthMiddleware, async (req, res)=>{
    const userId = req.userId;
    const blog_id = req.body.blogId;
    try {
        let queryBlog = `select user_id from blogs where blog_id = $1`;
        let deleteSql = `delete from blogs where blog_id = $1`;
        const result = await pool.query(queryBlog,[blog_id]);
        if (userId == result.rows[0].user_id){
            await pool.query(deleteSql,[blog_id]);
            return res.status(200).json({
                success: true,
                message: 'successfully deleted this post'
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
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

router.get('/categories', async (req, res)=>{
    try {
        let sql = `
        select 
            c.category_id, c.description, count(b.category_id) 
        from 
            blogs b 
        right join 
            categories c 
        on 
            b.category_id = c.category_id 
            and b.is_private = false	
        group by 
            c.category_id,c.description
        order by category_id asc
        `;
        const result = await pool.query(sql);
        return res.status(200).json({
            success: true,
            data: result.rows,
        })
    }
    catch(err){
        return res.status(400).json({
            success: false,
            message: 'something wrong happeded to the server, please try again later'
        })
    }
})

router.get('/categories/:name', async (req, res)=>{
    try {
        const description = req.params.name;
        let sql = `
        select 
            b.blog_id, b.blog_title, b.created_on
        from 
            blogs b 
        left join 
            categories c 
        on 
            b.category_id = c.category_id 
        where 
            b.is_private = false 
            and c.description = $1
        order by 
            b.created_on desc`
        ;
        const result = await pool.query(sql, [description]);
        return res.status(200).json({
            success: true,
            data: result.rows,
        })
    }
    catch(err){
        return res.status(400).json({
            success: false,
            message: 'something wrong happeded to the server, please try again later'
        })
    }
})

router.post('/switchPrivate', isAuthMiddleware, async (req, res)=>{
    const userId = req.userId;
    const blog_id = req.body.blogId;
    try {
        let queryBlog = `select user_id, is_private from blogs where blog_id = $1`;
        let updatesql = `update blogs set is_private = $1 where blog_id = $2`;
        const result = await pool.query(queryBlog,[blog_id]);
        if (userId == result.rows[0].user_id){
            await pool.query(updatesql, [!result.rows[0].is_private, blog_id]);
            return res.status(200).json({
                success: true,
                message: 'successfully updated this post'
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
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
module.exports = router;


