/**
 * 2014/11/6
 * @module
 * @description     消费记录
 * @author 黄耀奎
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter(),
    _ = require('underscore');

var consumerLogSchema = new schema({
    diningMemberId : {type: schema.Types.ObjectId, ref:'diningMember'}, // 会员ID
    consumer : {type: Number, default: 0},                              // 消费金额
    giveMoney    : {type: Number, default: 0},                          // 消费赠送金额
    points : {type: Number, default: 0},                                // 消费积分
    datetime : {type: Date, default: Date.now},                         // 创建时间
    restOrdersId : {type: schema.Types.ObjectId, ref: 'restOrders'},    // 消费内容（如：订单号码等）
    isUpload: {type: Boolean, default: false},                          // 是否上传了
    isDel: {type: Boolean, default: false}                              // 是否删除了
});
consumerLogSchema.index({diningMemberId: 1});
consumerLogSchema.index({diningMemberId: 1, datetime: 1});
consumerLogSchema.index({datetime:1});

validate.add('consumer', {
    required: true,
    msg: '消费金额不能为空'
});
validate.add('giveMoney', {
    required: true,
    msg: '赠送金额不能为空'
});

validate.add('points', {
    required: true,
    msg: '消费积分不能为空'
});

validate.add('diningMemberId', {
    callback: function (value, respond) {
        this.model('diningMember').find({
            _id: value
        }, function (e, doc) {
            if(e) return respond(e);
            if(doc.length > 0){
                respond(true)
            }else{
                respond(false)
            }
        });    
    },
    msg: '该会员不存在'
});

validate.add('restOrdersId', {
    callback: function (value, respond) {
        this.model('restOrders').find({
            _id: value
        }, function (e, doc) {
            if(e) return respond(e);
            if(doc.length > 0){
                respond(true)
            }else{
                respond(false)
            }
        });
    },
    msg: '该订单不存在'
});

mongooseValidateFilter.validateFilter(consumerLogSchema, validate, filter);
mongoose.model('consumerLog', consumerLogSchema);