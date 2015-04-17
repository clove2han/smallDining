/**
 * 2014/11/25
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var models = require(MODELS);
var rechargeLog = models.rechargeLog;

/*
* 添加一条充值记录
* */
exports.addOneRechargeLog = function (newRechargeLog, callback) {
    rechargeLog.createOne(newRechargeLog, callback)
};

/*
 * 删除一条充值记录
 * */
exports.removeOneLog = function (condition, callback) {
    rechargeLog.removeOne(condition, callback)
};

/*
 * 查询充值记录
 * */
exports.queryRechargeLog = function (condition, callback) {
    rechargeLog.find(condition, callback)
};
/**
 * 更新充值记录
 * @param query
 * @param update
 * @param callback
 */
exports.updateRechargeLog=function(query,update,callback){
    rechargeLog.updateOne(query,update,callback)
};