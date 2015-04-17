/**
 * @module proxy/memberLevel
 * @description 会员等级信息DAO
 * @author 韩皎
 * @modified By
 */

var models = require(MODELS);
var memberLevel = models.memberLevel;

/**
 * 新增会员等级
 * @param newMemberLevel ：会员等级对象
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.addMemberLevel = function (newMemberLevel, callback) {
    memberLevel.createOne(newMemberLevel, callback);
};

/**
 * 删除会员等级
 * @param query ：删除的过滤条件
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.remove = function (query, callback) {
    memberLevel.removeOne(query, callback);
};

/**
 * 根据query查询会员等级
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getMemberLevel = function (query, opt, callback) {
    var displayField = '_id name minAmount maxAmount discounts';
    memberLevel.find(query, opt)        //查询条件
        .select(displayField)           //显示的字段
        .sort({discounts: -1})           //排序字段及方式
        .exec(callback);                //返回结果
};

/**
 * 修改台会员等级信息
 * @param query  更新的过滤条件,
 * @param update 更新的内容,
 * @param opt    参数
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.updateMemberLevel = function (query, update, callback) {
    memberLevel.updateOne(query, update, callback);
};