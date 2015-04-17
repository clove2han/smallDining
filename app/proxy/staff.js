/**
 * 2014/10/15
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */

var models = require(MODELS);
var staff = models.staff;
var utility = require('utility');

/**
 * 添加一个用户
 * Callback:
 * - err, 数据库异常
 * - role, 角色
 * @param {String} newRole 新用户数据{}
 * @param {Function} callback 回调函数
 */
exports.addStaff = function (newRole, callback) {
    staff.createOne(newRole, callback);
};

exports.getStaffByQuery = function (query, opt, callback){
    //var displayfield = "account userName state role createDate position password";
    staff
        .find(query, opt)
        .populate('role', 'permissionList')
        //.select(displayfield)
        .exec(callback);
};

exports.getOneStaff = function (condition, callback) {
    staff.findOne(condition)
        .exec(callback);
};

exports.removeStaff = function (query, callback) {
    staff.removeOne(query, callback);
};

exports.updateStaff = function (query, update, callback) {
    staff.updateOne(query, update, callback);
}