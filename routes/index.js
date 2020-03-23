
const authRouter = require('./auth/Auth');
const blogsRouter = require('./blogs/blogs');

module.exports = (app) => {
    app.use('/api/auth', authRouter);
    app.use('/api/blogs', blogsRouter);
}