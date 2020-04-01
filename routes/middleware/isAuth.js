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
        return res.status(400).json({
            success: false,
            message: 'Failed to verify token: ' + err
        })
    }
    if(!decodeToken){
        return res.status(401).json({
            success: false,
            message: 'Invalid token or expired',
        })
    }
    req.userId = decodeToken.userId;
    next();
}