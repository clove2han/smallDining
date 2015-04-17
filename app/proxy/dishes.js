/**
 * @module proxy/dishes
 * @description 菜品信息的DAO
 * @author 冀玉鑫
 * @modified By
 */
var models = require(MODELS);
var dishes = models.dishes;

/**
 * 根据query查询符合条件的菜品
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getDishesByQuery = function (query, opt, callback) {
    var displayField = "";
    if(arguments[3]){
        displayField = arguments[3];
    }else{

        displayField = '_id name abbr typeId imgName price intro salePrice saleType state salesVolume createDate surplus remark sort flavorId activityType supplyTimeId haveOnNumber isPack isDel packageContent isPackage isNeedCook';
    }
    dishes
        .find(query, opt)
        .select(displayField)
        .sort({sort: 1,createDate: -1})
        .populate('flavorId', '_id name remark')
        .populate('supplyTimeId', '_id name')
        .exec(callback);
};

/**
 * 根据query查询符合条件的菜品(分页）
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getDishesByPage = function (query, opt, callback) {
    var displayField = 'name abbr typeId imgName price intro salePrice saleType state salesVolume createDate surplus remark sort flavorId activityType timeTypeName haveOnNumber';
    dishes
        .find(query)
        .select(displayField)
        .sort({sort: 1,createDate: -1})
        .skip(opt.skip)
        .limit(opt.limit)
        .populate('flavorId')
        .exec(callback);
};

/**
 * 查询菜品集合中最大排序号
 * @param callback ：回调函数 function（err, [{_id: null, sort: $maxSort}])
 */
exports.getDishesByMaxSort = function (callback) {
    dishes.aggregate()
        .group({ _id: null, sort: { $max: '$sort' } })
        .exec(callback);
};

/**
 * 根据query查询符合条件的一条菜品
 * @param _id ：   _ID
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getDishesById = function (_id, opt, callback) {
    var displayField = 'name abbr typeId imgName price intro salePrice saleType state salesVolume createDate surplus remark sort flavorId activityType';
    dishes.findById(_id, opt)
        .select(displayField)
        .exec(callback);
};

exports.getOneDishes = function (condition, callback) {
    dishes.findOne(condition)
        .exec(callback);
};

/**
 * 根据query查询符合条件的菜品数量
 * @param query ：   检索条件
 * @param callback ：回调函数 function（err,count)
 */
exports.getDishesCount = function (query, callback) {
    dishes.count(query, callback);
};

/**
 * 新增一个菜品
 * @param newDishes ：菜品对象
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.addDishes = function (newDishes, callback) {
    dishes.createOne(newDishes, callback);
};

/**
 * 删除指定的菜品
 * @param query ：删除的过滤条件
 * @param callback  ：   回调函数 function（err)
 */
exports.removeDishes = function (query, callback) {
    dishes.removeOne(query, callback);
};

/**
 * 更新指定的菜品
 * @param query ：更新的过滤条件
 * @param update : 更新的内容
 * @param opt : 参数
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.updateDishes = function (query, update, callback) {
    dishes.updateOne(query, update, callback);
};

/**
 * 更新指定的菜品可供数量
 * @param query ：更新的过滤条件
 * @param increment : 可供数量的增值
 * @param opt : 参数
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.updateDishesForSurplus = function (query, increment, callback) {
    dishes.updateOne(query, { $inc: {"surplus": increment} }, callback);
};

/**
 * 更新指定的菜品销量
 * @param query ：更新的过滤条件
 * @param increment : 销量的增值
 * @param opt : 参数
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.updateDishesForSalesVolume = function (query, increment, callback) {
    dishes.updateOne(query, { $inc: {"salesVolume": increment} }, callback);
};


exports.update = function (condition, update, callback) {
    dishes.update(condition, update, callback);
};

exports.queryOneData = function (condition,  callback) {
    dishes.findOne(condition,  callback);
};
