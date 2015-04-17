/**
 * @module       proxy/queue
 * @description
 * @author
 * @modified By 韩皎
 */

var models = require(MODELS);
var queue = models.queue;


/**
 * 新增一个排位号
 * @param newQueue ：排位对象
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.addQueue = function (newQueue, callback) {
    queue.createOne(newQueue, callback);
};

/**
 * 删除指定排位号
 * @param query ：删除的过滤条件
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.remove = function (query, callback) {
    queue.removeOne(query, callback);
};
/**
 * 根据query查询符合条件的台位
 * @param query ：   查询条件
 * @param opt   ：   参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.getQueueByQuery = function (query, opt, callback) {
    var displayField = '_id queueNumber mealsNumber tableTypeId tableTypeName createDate';
    queue.find(query, opt)        //查询条件
        .select(displayField)      //显示的字段
        .sort({queueNumber: 1})  //排序字段及方式
        .exec(callback);          //返回结果
};

/**
 * 查询排位表中最大排位号
 * @param callback ：回调函数 function（err, [{_id: null, sort: $maxqueueNumber}])
 */
exports.getQueueNumberByMaxSort = function (callback) {
    queue.aggregate()
        .group({ _id: null, queueNumber: { $max: '$queueNumber' }})
        .exec(callback);
};