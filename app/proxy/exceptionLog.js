/**
 * @module app/proxy/exceptionLog.js
 * @description 异常日志 DAO
 * @author 冀玉鑫
 * @modified By
 */
var exceptionLog = require(BASEDIR + '/app/models').exceptionLog;

/**
 * 根据query查询符合条件的异常日志
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getExceptionLogByQuery = function (query, opt, callback) {
    exceptionLog
        .find(query, opt)
        .sort({createTime: -1})
        .exec(callback);
};

/**
 * 根据query查询符合条件的异常日志数量
 * @param query ：   检索条件
 * @param callback ：回调函数 function（err,count)
 */
exports.getExceptionLogCount = function (query, callback) {
    exceptionLog.count(query, callback);
};

/**
 * 新增一个异常日志
 * @param newExceptionLog ：异常日志对象
 * @param callback  ：   回调函数 function（err, jellybeen)
 */
exports.addExceptionLog = function (newExceptionLog, callback) {
    exceptionLog.createOne(newExceptionLog, callback);
};
