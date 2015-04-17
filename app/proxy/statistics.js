/**
 * @module proxy/restOrders
 * @description 订单的DAO
 * @author 冀玉鑫
 * @modified By
 */
var models = require(MODELS);
var restOrders = models.restOrders;

/**
 * 根据query查询符合条件的所有订单
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.memberAnalyze = function (query, opt, callback) {
    restOrders
        .find(query, opt)
        .exec(callback);
};

/**
 * 根据query查询符合条件的一条订单
 * @param _id ：   _ID
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.restAnalyze = function (query, opt, callback) {
    restOrders
        .find(query, opt)
        .exec(callback);
};
