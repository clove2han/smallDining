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
exports.getRestOrdersByQuery = function (query, opt, callback) {
    restOrders
        .find(query)
        .sort({createDate: -1})
        .skip(opt.skip)
        .limit(opt.limit)
        .populate('diningMemberId', '_id membNo name tel')
        .exec(callback);
};

/**
 * 根据query查询符合条件的所有订单
 * 用于同步小猫服务器
 */
exports.getRestOrdersByQueryNoOpt=function(query, opt, callback){
    restOrders
        .find(query)
        .exec(callback);
};

/**
 * 根据query查询符合条件的一条订单
 * @param _id ：   _ID
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getRestOrdersById = function (_id, opt, callback) {
    restOrders.findById(_id, opt, callback);
};

/**
 * 根据query查询符合条件的订单数量
 * @param query ：   检索条件
 * @param callback ：回调函数 function（err,count)
 */
exports.getRestOrdersCount = function (query, callback) {
    restOrders.count(query, callback);
};

/**
 * 新增一个订单
 * @param newRestOrders ：订单对象
 * @param callback  ：   回调函数 function（err,jellybeen )
 */
exports.addRestOrders = function (newRestOrders, callback) {
    restOrders.createOne(newRestOrders, callback);
};

/**
 * 更新指定的订单
 * @param query ：更新的过滤条件
 * @param update : 更新的内容
 * @param opt : 参数
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.updateRestOrders = function (query, update, callback) {
    restOrders.updateOne(query, update, callback);
};


/*
 * 删除一个订单
 * @param condition ：删除的条件
 * @param callback  ：   回调函数 function（err,doc)
 **/
exports.removeOneOrder = function (condition, callback) {
    restOrders.removeOne(condition, callback);
};

exports.getOneOrder = function (condition, callback) {
    restOrders.findOne(condition, callback);
};

exports.groupByCondition = function (condition, callback) {
    var displayField = "_id payment totalPrice refund discountPrice orderNumber cashier orderType createDate";
    restOrders
        .find(condition)
        .select(displayField)
        .exec(callback);
    /*restOrders.aggregate([
            {$match: condition},
            {$group:{_id:{orderType: "$orderType", orderState: "$orderState", cashier: "$cashier"},total:{$sum:"$totalPrice"}}}
        ]
    ).exec(callback);*/
}

/**
 * 事务使用
 * @param query
 * @param callback
 */
exports.queryOneData = function (query, callback) {
    restOrders.findOne(query, callback);
};

exports.update = function (query, update, callback) {
    restOrders.update(query, update, callback);
};
