/**
 * @module       proxy/tableType
 * @description  数据库交互模块
 * @author
 * @modified By 韩皎
 */

var models = require(MODELS);
var tableType = models.tableType;

/**
 * 新增一个台位类型
 * @param newTableType ：台位类型对象
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.addTableType = function (newTableType, callback) {

    tableType.createOne(newTableType, callback);
};


/**
 * 修改台位类型信息
 * @param query    : 更新的过滤条件
 * @param update   : 更新的内容
 * @param opt      : 参数
 * @param callback : 回调函数 function（err,doc)
 */
exports.updateTableType = function (query, update, callback) {
    tableType.updateOne(query, update, callback);
};

/**
 * 删除指定台位类型
 * @param query ：删除的过滤条件
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.removeTableType = function (query, callback) {
    tableType.removeOne(query, callback);
};

/**
 * 根据query查询符合条件的台位类型
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getTableTypeByQuery = function (query, opt, callback) {
    var displayField = 'name sort number state';
    tableType.find(query, opt)         //查询条件
        .select(displayField)          //显示的字段
        .sort({sort: 1})               //排序字段及方式
        .exec(callback);               //返回结果
};
/**
 * 根据query查询符合条件的台位类型
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getOneTableType = function (query, callback) {
    tableType.findOne(query)
        .exec(callback);
};

/**
 * 根据查询台位可坐人数
 * @param query ：   空
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getNumber = function (query, opt, callback) {
    var displayField = 'name number state';
    tableType.find(query, opt)         //查询条件
        .select(displayField)           //显示的字段
        .sort({number:1})
        .exec(callback);                //返回结果
};