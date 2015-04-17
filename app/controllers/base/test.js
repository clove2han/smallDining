
var router = require('express').Router();
var exceptionLog = require(BASEDIR + '/app/proxy/exceptionLog');

/**
 */
router.get('/addLog', function (req, res) {

    var exception = {
        userId: "",                 //发生错误用户ID
        exception_type: "exception",//异常类型
        exception_ip: res.ip,       //异常IP
        exception_level: "3",       //异常级别
        op_type: "",                //操作类型
        exception_records: "异常记录",  //异常记录
        createTime: Date.now()
    };
    console.log(exception);
    exceptionLog.addExceptionLog(exception,function(){});
    return returnSUCCESS(res, "成功");
});


module.exports = router;