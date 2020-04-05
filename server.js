const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const bodyParser = require('body-parser');
const router = require('./routes');

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, 'views')));
}
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));

//below must be set before using res.sendFile:
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static('public')); //static middleware can be called mutiple times until a file is found

router(app);
// app.get('/', function(req, res) {
//     console.log('is getting /')
//     res.sendFile(__dirname, "build", "index.html");
// });

app.get('/robots.txt', (req,res)=>{
    res.sendFile(__dirname,"public/robots.txt");
})

app.listen(port,()=>{
    console.log(`Server is listening to ${port}`)
});
