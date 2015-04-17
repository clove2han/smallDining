/**
 * 2014/10/14.
 * @description
 * @author 黄耀奎
 * @modified By
 */
var models = require(MODELS);
var role = models.role;
var utility = require('utility');

/**
 * 添加一个用户
 * Callback:
 * - err, 数据库异常
 * - role, 角色
 * @param {String} newRole 新用户数据{}
 * @param {Function} callback 回调函数
 */
exports.addRole = function (newRole, callback) {

    role.createOne(newRole, callback);
};

/**
 * 根据条件，获取数据
 * Callback:
 * - err, 数据库异常
 * - role: 角色数据,
 * @param {String} query 条件
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getRoleByQuery = function (query, opt, callback) {
    var displayField = "name permissionList";
    role.find(query, opt)
        .select(displayField)
        .exec(callback);
};

/**
 * 根据条件，删除数据
 * Callback:
 * - err, 数据库异常
 * - permission: ,
 * @param {String} query 条件
 * @param {Function} callback 回调函数
 */
exports.removeRole = function (query, callback) {
    role.removeOne(query, callback);
};

/**
 * 修改一个功能代号
 * Callback:
 * - err, 数据库异常
 * - permission,
 * @param {String} query 查询条件
 * @param {String} update 修改的数据
 * @param {Function} callback 回调函数
 */
exports.updateRole = function (query, update, callback) {

    role.updateOne(query,update, callback);
};
