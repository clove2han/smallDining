/**
 * @module proxy/dishesOrder
 * @description 菜品订单的DAO
 * @author 冀玉鑫
 * @modified By
 */
var models = require(MODELS);
var dishesOrder = models.dishesOrder;

/**
 * 根据query查询符合条件的所有菜品订单
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getDishesOrderByQuery = function (query, opt, callback) {
    dishesOrder
        .find(query, opt)
        .sort({createTime: 1})
        .populate('orderId','orderNumber foundingInfo.diningTableName createDate cashier ongoing isDone orderType orderState isPack discount totalPrice discountPrice waiter payment payDate')
        .populate('dishTypeId','name _id')
        .populate('dishesId','name _id isNeedCook')
        .exec(callback);
};

/**
 * 根据query查询符合条件的菜品订单数量
 * @param query ：   检索条件
 * @param callback ：回调函数 function（err,count)
 */
exports.getDishesOrderCount = function (query, callback) {
    dishesOrder.count(query, callback);
};

/**
 * 新增一个菜品订单
 * @param newDishesOrder ：菜品订单对象
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.addDishesOrder = function (newDishesOrder, callback) {
    dishesOrder.createOne(newDishesOrder, callback);
};

/**
 * 删除指定的菜品订单
 * @param query ：删除的过滤条件
 * @param callback  ：   回调函数 function（err)
 */
exports.removeDishesOrder = function (query, callback) {
    dishesOrder.removeOne(query, callback);
};

/**
 * 更新指定的菜品订单
 * @param query ：更新的过滤条件
 * @param update : 更新的内容
 * @param opt : 参数
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.updateDishesOrder = function (query, update, callback) {
    dishesOrder.updateOne(query, update, callback);
};


exports.saveDishesOrders = function (DishesOrders, callback) {
    dishesOrder.create(DishesOrders, callback);
};

exports.getDishesOrder = function (condition, callback) {
    dishesOrder
        .find(condition,{__v:0})
        .exec(callback);
};


exports.getSnackDishesOrder = function (condition, callback) {
    dishesOrder
        .find(condition,{__v:0})
        .populate('orderId','orderNumber foundingInfo.diningTableName createDate cashier ongoing isDone orderType orderState isPack discount totalPrice discountPrice waiter')
        .populate('dishTypeId','name _id')
        .populate('dishesId','name _id isNeedCook')
        .exec(callback);
};

exports.updateDishesState = function (condition, update, options, callback) {
    dishesOrder.update(condition, update, options,callback);
};


/**
 * 事务使用
 * @param query
 * @param callback
 */
exports.queryOneData = function (query, callback) {
    dishesOrder.findOne(query, callback);
};

exports.update = function (query, update, callback) {
    dishesOrder.update(query, update, {multi: true},callback);
};

exports.remove = function (query,  callback) {
    dishesOrder.remove(query,  callback);
};
/**
 * 查询
 * 退菜报表
 *
 */
exports.queryRecedeDishSta=function(query,callback){
    dishesOrder
        .find(query)
        .populate('orderId','orderNumber orderType isPack cashier foundingInfo')
        .populate('dishTypeId','name _id')
        .exec(callback);
}