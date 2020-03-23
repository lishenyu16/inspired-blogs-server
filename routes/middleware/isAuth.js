const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization')
    if(!authHeader){
        res.status(400).json({
            success: false,
            message: 'Not authorized.'
        })
    }

    const token = authHeader.split(' ')[1];
    let decodeToken;
    try{
        decodeToken = jwt.verify(token, 'somereallylongsecret');
    }
    catch(err){
        console.log(err);
        res.status(400).json({
            success: false,
            message: 'Failed to verify token: ' + err
        })
    }
    if(!decodeToken){
        res.status(200).json({
            success: false,
            message: 'Invalid token or expired',
        })
    }
    req.userId = decodeToken.userId;
    next();
}