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

var cancelMemberLogSchema = new schema({
    diningMemberId : {type: schema.Types.ObjectId, ref:'diningMember'}, // 会员ID
    consumer : {type: Number, default: 0},                              // 注销金额
    giveMoney    : {type: Number, default: 0},                          // 注销赠送金额
    points : {type: Number, default: 0},                                // 注销积分
    datetime : {type: Date, default: Date.now},                         // 注销时间
    operator : {type: schema.Types.ObjectId, ref:'staff'},                              // 操作员
    isUpload: {type: Boolean, default: false},                          // 是否上传了
    isDel: {type: Boolean, default: false}                              // 是否删除了
});

cancelMemberLogSchema.index({diningMemberId: 1});
cancelMemberLogSchema.index({operator: 1});
cancelMemberLogSchema.index({diningMemberId: 1, datetime: 1});
cancelMemberLogSchema.index({datetime:1,operator:1});
cancelMemberLogSchema.index({datetime:1});

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


mongooseValidateFilter.validateFilter(cancelMemberLogSchema, validate, filter);
mongoose.model('cancelMemberLog', cancelMemberLogSchema);