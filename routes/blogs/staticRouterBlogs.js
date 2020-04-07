const express = require('express');
const path = require('path');
const router = express.Router();
const appRoot = require('app-root-path');

router.get('/public-blogs', async (req,res) => {
    res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
})

router.get('/confirm-email/:code/:userId', async (req,res) => {
    res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
})
router.get('/blog-detail/:blog_id', async (req,res) => {
    res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
})
router.get('/categories', async (req,res) => {
    res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
})
router.get('/profile', async (req,res) => {
    res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
})
router.get('/login', async (req,res) => {
    res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
})
router.get('/signup', async (req,res) => {
    res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
})
router.get('/forgot-password', async (req,res) => {
    res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
})

router.get('/', async (req,res) => {
    res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
})

module.exports = router;


