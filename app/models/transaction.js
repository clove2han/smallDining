/**
 * 2014/11/11
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter(),
    _ = require('underscore');


var transactionSchema = new schema({
    fromCollection : String,                //更改谁的集合
    content: {},	                        //更改的内容
    superior: String,
    state: String,	                        //事务状态（初始化事务:initial,进行中: pending,完成: done, 已经回滚: canceled）
    time: {type:Date, default:Date.now},
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});

transactionSchema.index({fromCollection:1});

validate.add('fromCollection', {
    required: true,
    msg: '更改目标集合不能为空'
});

/*validate.add('content', {
    required: true,
    msg: '更改内容不能为空'
});*/


validate.add('state', {
    required: true,
    msg: '更改状态不能为空'
});

mongooseValidateFilter.validateFilter(transactionSchema, validate, filter);
mongoose.model('transaction', transactionSchema);