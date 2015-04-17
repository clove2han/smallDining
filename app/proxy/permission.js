/**
 * 2014/10/13.
 * @description
 * @author 黄耀奎
 * @modified By
 */
var models = require(MODELS);
var permission = models.permission;

/**
 * 添加一个功能代号
 * Callback:
 * - err, 数据库异常
 * - permission, 功能代号信息
 * @param {String} newPermission 数据{func:'',description: '', path: ''}
 * @param {Function} callback 回调函数
 */
exports.addPermission = function (newPermission, callback) {

    permission.createOne(newPermission, callback);
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
exports.updatePermission = function (query, update, callback) {

    permission.updateOne(query,update, callback);
};

/**
 * 根据条件，获取数据
 * Callback:
 * - err, 数据库异常
 * - permission: 权限数据,
 * @param {String} query 条件
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getPermissionByQuery = function (query, opt, callback) {
    var displayField = "func remark path";
    permission
        .find(query, opt)
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
exports.removePermission = function (query, callback) {
    permission.removeOne(query, callback);
};

