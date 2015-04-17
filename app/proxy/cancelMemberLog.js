/**
 * 2014/11/6
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var models = require(MODELS);
var cancelMemberLog = models.cancelMemberLog;

/**
 * 添加一条积分记录
 * @param newConsumer Object 添加积分数据
 * @param callback function 回调函数
 * */

exports.addOneCancelMemberLog = function (newConsumer, callback) {
    cancelMemberLog.createOne(newConsumer, callback);
};

exports.removeOneCancelMemberLog = function (condition, callback) {
    cancelMemberLog.removeOne(condition, callback);
};

exports.getCancelMemberLogByQuery = function (condition, callback) {
    cancelMemberLog.find(condition, callback);
};
exports.getCancelMemberCount=function(query,callback){
    cancelMemberLog.count(query,callback);
}