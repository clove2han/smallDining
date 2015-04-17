/**
 * 2014/11/6
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var models = require(MODELS);
var consumerLog = models.consumerLog;

/**
 * 添加一条积分记录
 * @param newConsumer Object 添加积分数据
 * @param callback function 回调函数
 * */

exports.addOneConsumer = function (newConsumer, callback) {
    consumerLog.createOne(newConsumer, callback);
};

exports.removeOneConsumer = function (condition, callback) {
    consumerLog.removeOne(condition, callback);
}

exports.getConsumerLogByQuery = function (condition, callback) {
    consumerLog.find(condition, callback);
};