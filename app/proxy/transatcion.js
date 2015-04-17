/**
 * 2014/11/11
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var models = require(MODELS);
var transatcion = models.transatcion;

exports.createOneTransatcion = function (newTransatcion, callback) {
    transatcion.createOne(newTransatcion, callback);
};

exports.updateOneTransatcion = function (condition, update, callback) {
    transatcion.updateOne(condition, update, callback);
};

exports.getTranstcionByQuery = function (query, callback) {
    var displayField = "from change state";
    transatcion.find(query)
        .select(displayField)
        .exec(callback);
};

exports.removeOneTrans = function (transId, callback) {
    transatcion.removeOne({_id: transId}, callback);
};