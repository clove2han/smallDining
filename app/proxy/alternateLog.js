/**
 * 2014/11/6
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var models = require(MODELS);
var alternateLog = models.alternateLog;

/**
 * 查询交接班记录
 * @param alternate Object 交接班查询条件
 * @param callback function 回调函数
 */
exports.getAlternateLogByQuery = function (alternate, callback) {
    alternateLog
        .find(alternate, callback)
        .populate('operator','userName _id');
};

/**
 * 添加一条交接班记录
 * @param newAlternate Object 添加交接班数据
 * @param callback function 回调函数
 */
exports.addOneAlternateLog = function (newAlternate, callback) {
    alternateLog.createOne(newAlternate, callback);
};
