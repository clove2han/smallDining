/**
 * @module proxy/flavor
 * @description 菜品口味的DAO
 * @author 冀玉鑫
 * @modified By
 */
var models = require(MODELS);
var flavor = models.flavor;

/**
 * 根据query查询符合条件的所有口味
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getFlavorByQuery = function (query, opt, callback) {
    flavor
        .find(query, opt)
        .exec(callback);
};

/**
 * 根据query查询符合条件的一条口味
 * @param _id ：   _ID
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getFlavorById = function (_id, opt, callback) {
    flavor.findById(_id, opt, callback);
};

/**
 * 根据query查询符合条件的口味数量
 * @param query ：   检索条件
 * @param callback ：回调函数 function（err,count)
 */
exports.getFlavorCount = function (query, callback) {
    flavor.count(query, callback);
};

/**
 * 新增一个口味
 * @param newDishesType ：口味对象
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.addFlavor = function (newDishesType, callback) {
    flavor.createOne(newDishesType, callback);
};

/**
 * 删除指定的口味
 * @param query ：删除的过滤条件
 * @param callback  ：   回调函数 function（err)
 */
exports.removeFlavor = function (query, callback) {
    flavor.removeOne(query, callback);
};

/**
 * 更新指定的口味
 * @param query ：更新的过滤条件
 * @param update : 更新的内容
 * @param opt : 参数
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.updateFlavor = function (query, update, callback) {
    flavor.updateOne(query, update, callback);
};
