/**
 * @module proxy/pointsRule
 * @description 积分规则信息
 * @author 韩皎
 * @modified By
 */

var models = require(MODELS);
var pointsRule = models.pointsRule;

/**
 * 新增积分规则
 * @param newPointsRule ：积分规则对象
 * @param callback  ：    回调函数 function（err,jellybeen ,snickers)
 */
exports.addPointsRule = function (newPointsRule, callback) {
    pointsRule.createOne(newPointsRule, callback);
};

///**
// * 删除积分规则
// * @param query ：删除的过滤条件
// * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
// */
//exports.remove = function (query, callback) {
//    pointsRule.removeOne(query, callback);
//};

/**
 * 根据query查询积分规则
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getPointsRule = function (query, opt, callback) {
    var displayField = 'consumer returnPoints';
    pointsRule.find(query, opt)        //查询条件
        .select(displayField)          //显示的字段
        .exec(callback);               //返回结果
};

/*
 *查询最后添加的积分规则
 */
exports.getLastPointsRule = function (callback) {
    var displayField = 'consumer returnPoints';
    pointsRule.find({})
        .select(displayField)
        .sort({Date: -1})
        .exec(callback);
};

/**
 * 修改积分规则
 * @param query ：更新的过滤条件
 * @param update : 更新的内容
 * @param opt : 参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.updatePointsRule = function (query, update, callback) {
    pointsRule.updateOne(query, update, callback);
};