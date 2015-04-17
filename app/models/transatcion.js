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

var transatcionSchema = new schema({
    from : String,              //更改谁
    change: {},	                //更改的内容
    consumerLogId: String,      //消费记录Id,
    rechargeLogId: String,      //充值记录Id
    state: String,	            //事务状态（初始化事务:initial,进行中: pending,完成中: committed,完成: done,取消中: canceling, 已经取消: canceled）
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});

transatcionSchema.index({from:1});

validate.add('from', {
    required: true,
    msg: '更改目标不能为空'
});

validate.add('change', {
    callback: function (value, responde) {
        if(value.price){
            responde(true);
        }else{
            responde(false);
        }

    },
    msg: '更改内容为空'
});

validate.add('state', {
    required: true,
    msg: '更改状态不能为空'
});

mongooseValidateFilter.validateFilter(transatcionSchema, validate, filter);
mongoose.model('transatcion', transatcionSchema);