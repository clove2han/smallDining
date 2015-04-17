var log4js = require('log4js');

log4js.configure({
    appenders: [
        {   //控制台输出
            type: 'console'
        },
        {  ///日期文件格式
            type: "dateFile",
            filename: BASEDIR + '/logs/access',
            pattern: "-yyyy-MM-dd.log",
            backups:4,
            maxLogSize: 1024,
            alwaysIncludePattern: true,
            category: 'dateFileLog'
        }
    ],
    replaceConsole: true,   //替换console.log
    levels:{
        dateFileLog: 'info'
    }
});
var logger = log4js.getLogger('normal');
logger.setLevel('info');

exports.logger = logger;

exports.use = function(app) {
    app.use(log4js.connectLogger(logger, {level:log4js.levels.INFO}));
};