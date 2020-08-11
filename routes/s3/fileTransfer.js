const express = require('express');
const router = express.Router();
const isAuthMiddleware = require('../middleware/isAuth');
const AWS = require('aws-sdk');
const multer = require('multer');
const dotenv = require('dotenv');
dotenv.config();

// Enter copied or downloaded access ID and secret key here
const ID = process.env.ID;
const SECRET = process.env.SECRET;
// The name of the bucket that you have created
const BUCKET_NAME = 'inspiredblogs';
const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});
const upload = multer();
// const uploadFile = (fileName) => {
//     // Read content from the file
//     const fileContent = fs.readFileSync(fileName);

//     // Setting up S3 upload parameters
//     const params = {
//         Bucket: BUCKET_NAME,
//         Key: 'cat.jpg', // File name you want to save as in S3
//         Body: fileContent
//     };

//     // Uploading files to the bucket
//     s3.upload(params, function(err, data) {
//         if (err) {
//             throw err;
//         }
//         console.log(`File uploaded successfully. ${data.Location}`);
//     });
// };

router.post('/uploadImage', isAuthMiddleware, upload.any(), async (req, res) => {
    const userId = req.userId;
    // console.log('files: ', req.files);
    const file = req.files[0];
    const mimetype = file.mimetype;
    try {
        const timestamp = new Date().getTime();
        const params = {
            Bucket: BUCKET_NAME,
            Key: 'blog_images/' + `${userId}/${userId}_${timestamp}`, // File name you want to save as in S3
            Body: file.buffer,
            Type: mimetype
        };
        await s3.upload(params, function(err, response) {
            if (err){
                return res.status(500).json({message: 'Failed to upload.'})
            }
            res.status(200).json({
                success: true,
                imageUrl: response.Location
                // imageUrl: `https://inspiredblogs.s3-us-west-2.amazonaws.com/blog_images/${userId}/${timestamp}_${file.name}`
            })
        });
        // https://inspiredblogs.s3-us-west-2.amazonaws.com/blog_images/profile.png
    }
    catch(err){
        console.log(err);
        res.status(400).json({
            success: false,
            message: 'failed to upload to S3'
        })
    }
})

module.exports = router;