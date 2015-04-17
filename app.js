//全局设置
require('./globals');

var express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    multipart = require('connect-multiparty'),
    //session
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    //路由
    routes = require(BASEDIR + '/routes/routes'),
    config = require(BASEDIR + '/app/config/config.json'),
    compression = require('compression'),
    app = express(),
    syncData = require(BASEDIR+ '/app/common/utils/syncData');
    rollback = require(BASEDIR+ '/app/common/utils/rollback');

    //添加日志记录
    var log = require('./log');
    log.use(app);

    app.set('views', path.join(__dirname, '/app/views'));
    app.set('view engine', 'ejs');

    app.use(compression());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    //全局附件上传的过滤器
    global.multipartMiddleware = multipart({
        uploadDir: path.join(__dirname, 'temp')
    });
    //app.use(express.compress());//支持gzip
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use(session({
        secret: config.cookieSecret,
        key: 'sid',
        store: new MongoStore({
            url: config.db
        }),
        resave: true,
        saveUninitialized: true
    }));

    routes(app);

    //回滚
    rollback.all();

    //联网状态下同步数据
    if(config.isConnected){
        //同步数据
        //syncData.all();
        //syncData.syncDishesType();
        //syncData.syncDishes();
        //syncData.syncTableType();
        //syncData.syncTable();
        //syncData.syncFlavor();
        //syncData.syncMemberLevel();
        //syncData.syncPointsRule();
        //syncData.syncRole();
        //syncData.syncDiningMember();
        //syncData.syncStaff();
        //syncData.syncSupplyTime();
        //syncData.syncRestOrders();
        //syncData.syncRechargeLog();
    }

    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handlers
    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        return res.render('error', {
            message: err.message,
            error: {}
        });
    });

    module.exports = app;