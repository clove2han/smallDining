/**
 * 2014/11/11
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var models = require(MODELS);
var transaction = models.transaction;

exports.createOneTransaction = function (newTransaction, callback) {
    transaction.createOne(newTransaction, callback);
};

exports.updateOneTransaction = function (condition, update, callback) {
    transaction.updateOne(condition, update, callback);
};

exports.getTransactionByQuery = function (query, callback) {
    transaction
        .find(query)
        .sort({time:-1})
        .exec(callback);
};

exports.removeOneTrans = function (condition, callback) {
    transaction.removeOne(condition, callback);
};

exports.update = function (condition, update, callback) {
    transaction.update(condition, update, callback);
};

exports.remove = function(condition, callback){
    transaction.remove(condition, callback);
};