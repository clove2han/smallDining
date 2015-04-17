/**
 * @module proxy/dishesType
 * @description 菜品类型的DAO
 * @author 冀玉鑫
 * @modified By
 */
var models = require(MODELS);
var dishesType = models.dishesType;

/**
 * 根据query查询符合条件的所有菜品类型
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getDishesTypeByQuery = function (query, opt, callback) {
    dishesType
        .find(query, opt)
        .sort({sort: 1})
        .exec(callback);
};

/**
 * 根据query查询符合条件的一条菜品类型
 * @param _id ：   _ID
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getDishesTypeById = function (_id, opt, callback) {
    dishesType.findById(_id, opt, callback);
};

/**
 * 根据query查询符合条件的菜品类型数量
 * @param query ：   检索条件
 * @param callback ：回调函数 function（err,count)
 */
exports.getDishesTypeCount = function (query, callback) {
    dishesType.count(query, callback);
};

/**
 * 查询菜品类型集合中最大排序号
 * @param callback ：回调函数 function（err, [{_id: null, sort: $maxSort}])
 */
exports.getDishesTypeByMaxSort = function (callback) {
    dishesType.aggregate()
        .group({ _id: null, sort: { $max: '$sort' } })
        .exec(callback);
};

/**
 * 新增一个菜品类型
 * @param newDishesType ：菜品类型对象
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.addDishesType = function (newDishesType, callback) {
    dishesType.createOne(newDishesType, callback);
};

/**
 * 删除指定的菜品类型
 * @param query ：删除的过滤条件
 * @param callback  ：   回调函数 function（err)
 */
exports.removeDishesType = function (query, callback) {
    dishesType.removeOne(query, callback);
};

/**
 * 更新指定的菜品类型
 * @param query ：更新的过滤条件
 * @param update : 更新的内容
 * @param opt : 参数
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.updateDishesType = function (query, update, callback) {
    dishesType.updateOne(query, update, callback);
};

exports.updateDishesTypes = function (query, update, callback) {
    dishesType.update(query, update, { multi: true }, callback);
};
