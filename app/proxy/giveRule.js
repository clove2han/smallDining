/**
 * @module app/proxy/giveRule
 * @description 一卡通赠送规则的DAO
 * @author 冀玉鑫
 * @modified By
 */
var giveRule = require(BASEDIR + '/app/models').giveRule;

/**
 * 根据query查询符合条件的所有一卡通赠送规则
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getGiveRuleByQuery = function (query, opt, callback) {
    giveRule
        .find(query, opt)
        .sort({minAmount: -1})    //排序字段及方式
        .exec(callback);
};

/**
 * 新增一个一卡通赠送规则
 * @param newGiveRule ：一卡通对象
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.addGiveRule = function (newGiveRule, callback) {
    giveRule.createOne(newGiveRule, callback);
};

/**
 * 删除指定的一卡通赠送规则
 * @param query ：删除的过滤条件
 * @param callback  ：   回调函数 function（err)
 */
exports.removeGiveRule = function (query, callback) {
    giveRule.removeOne(query, callback);
};

/**
 * 更新指定的一卡通赠送规则
 * @param query ：更新的过滤条件
 * @param update : 更新的内容
 * @param opt : 参数
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.updateGiveRule = function (query, update, callback) {
    giveRule.updateOne(query, update, callback);
};
/**
 * 删除全部
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.removeAll = function (callback) {
    giveRule.remove({}, callback);
};