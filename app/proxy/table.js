/**
 * @module       proxy/table
 * @description  数据库交互模块
 * @author
 * @modified By 韩皎
 */
var models = require(MODELS);
var table = models.table;



/**
 * 新增一个台位
 * @param newTable ：台位对象
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.addTable = function (newTable, callback) {
    table.createOne(newTable, callback);
};

/**
 * 修改台位信息
 * @param query ：更新的过滤条件
 * @param update : 更新的内容
 * @param opt : 参数
 * @param callback  ：   回调函数 function（err,doc)
 */
exports.updateTable = function (query, update, callback) {
    table.updateOne(query, update, callback);
};

/**
 * 删除指定台位
 * @param query ：删除的过滤条件
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.removeTable = function (query, callback) {
    table.removeOne(query, callback);
};



/**
 * 根据query查询符合条件的台位
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getTableByQuery = function (query, opt, callback) {
    var displayField = 'name tableTypeId sort state remark mealsNumber orderId openDate _id';
    table.find(query, opt)         //查询条件
          .select(displayField)     //显示的字段
          .sort({sort: 1})         //排序字段及方式
          .exec(callback);          //返回结果
};

/**
 * 事务使用
 * @param query
 * @param callback
 */
exports.queryOneData = function (query, callback) {
    table.findOne(query, callback);
};
exports.update = function (query, update, callback) {
    table.updateOne(query, update, callback);
};