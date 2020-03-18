const express = require('express');
const path = require('path');
const logger = require('morgan');
const app = express();
const port = process.env.PORT || 5000;

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, 'views')));
}
app.use(logger('dev'));
//below must be set before using res.sendFile:
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static('public')); //static middleware can be called mutiple times until a file is found
app.get('/', function(req, res) {
  res.sendFile(__dirname, "build", "index.html");
});
app.get('/robots.txt', (req,res)=>{
    res.sendFile(__dirname,"public/robots.txt");
})
app.get('/hi', (req,res)=>{
    res.json({
        message:' Hou are old '
    })
})
app.listen(port,()=>{
    console.log(`Server is listening to ${port}`)
});
