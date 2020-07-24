
const authRouter = require('./auth/Auth');
const stockAuthRouter = require('./stocks/auth');
const quotesRouter = require('./stocks/quotes');
const blogsStaticRouter = require('./blogs/staticRouterBlogs');
const stocksStaticRouter = require('./stocks/staticRouterStocks');
const blogsRouter = require('./blogs/blogs');
const profileRouter = require('./profile/profile');
const s3Router = require('./s3/fileTransfer');

module.exports = (app) => {
    app.use('/blogs', blogsStaticRouter);
    app.use('/stocktrader', stocksStaticRouter);

    app.use('/api/auth', authRouter);
    app.use('/api/blogs', blogsRouter);
    app.use('/api/profile', profileRouter);
    app.use('/api/s3', s3Router);
    app.use('/api/stocktrader/quotes', quotesRouter);
    app.use('/api/stocktrader/auth', stockAuthRouter);
}