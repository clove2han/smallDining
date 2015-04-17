/**
 * 2014/12/2
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var models = require(MODELS);
var supplyTime = models.supplyTime;

/*
* 添加一个供应时间
* @param newSupplyTime object 数据对象
* @param callback function
* */
function createOneSupplyTime(newSupplyTime, callback) {
    supplyTime.createOne(newSupplyTime, callback);
}

/*
 * 根据条件查询
 * @param condition object 查询条件对象
 * @param callback function
 * */
function querySupplyTime(condition, callback) {
    supplyTime.find(condition, callback);
}

/*
 * 根据条件查询
 * @param condition object 删除条件对象
 * @param callback function
 * */
function removeOneSupplyTime(condition, callback) {
    supplyTime.removeOne(condition, callback);
}

/*
 * 根据条件查询
 * @param condition object 查询条件对象
 * @param condition object 修改内容对象
 * @param callback function
 * */
function updateOneSupplyTime(condition, updateData, callback) {
    supplyTime.update(condition, updateData, callback);
}

exports.createOneSupplyTime = createOneSupplyTime;
exports.querySupplyTime = querySupplyTime;
exports.removeOneSupplyTime = removeOneSupplyTime;
exports.updateOneSupplyTime = updateOneSupplyTime;