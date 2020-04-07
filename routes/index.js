
const authRouter = require('./auth/Auth');
const blogsStaticRouter = require('./blogs/staticRouterBlogs');
const blogsRouter = require('./blogs/blogs');
const s3Router = require('./s3/fileTransfer');

module.exports = (app) => {
    app.use('/blogs', blogsStaticRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/blogs', blogsRouter);
    app.use('/api/s3', s3Router);
}