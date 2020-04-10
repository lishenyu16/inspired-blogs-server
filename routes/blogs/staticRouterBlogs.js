const express = require('express');
const path = require('path');
const router = express.Router();
const appRoot = require('app-root-path');
const axios = require('axios');
const pool = require('../../db/index');
// router.get('/public-blogs', async (req,res) => {
//     res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
// })

// router.get('/confirm-email/:code/:userId', async (req,res) => {
//     res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
// })
// router.get('/reset-password/:code/:userId', async (req,res) => {
//     res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
// })
// router.get('/blog-detail/:blog_id', async (req,res) => {
//     res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
// })
// router.get('/profile/:targetId', async (req,res) => {
//     res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
// })
// router.get('/categories', async (req,res) => {
//     res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
// })
// router.get('/profile', async (req,res) => {
//     res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
// })
// router.get('/login', async (req,res) => {
//     res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
// })
// router.get('/signup', async (req,res) => {
//     res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
// })
// router.get('/forgot-password', async (req,res) => {
//     res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
// })

router.get('/*', async (req,res) => {
    try{
        let client_ip = req.ip;
        const result = await axios.get(`http://api.ipstack.com/${client_ip}?access_key=414bbc8587150a193ad94b0b99eb679f&format=1`);
        const {ip, type, continent_name, country_name,region_name,city,zip,latitude,longitude} = result.data;
        let sql = `insert into visitor_records (ip, type, continent_name, country_name,region_name,city,zip,latitude,longitude) values($1,$2,$3,$4,$5,$6,$7,$8,$9)`;
        await pool.query(sql,[ip, type, continent_name, country_name,region_name,city,zip,latitude,longitude]);
    }
    catch(err){
        console.log(err);
    }
    finally{
        res.sendFile(path.join(`${appRoot}/views`, 'index.html'));
    }

})

module.exports = router;


