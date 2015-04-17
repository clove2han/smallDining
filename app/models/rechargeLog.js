/**
 * 2014/11/25
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

var RechargeLogSchema = new schema({
    diningMemberId :{type: schema.Types.ObjectId, ref:'diningMember'},                  // 小猫账号ID
    amount : {type: Number, default: 0},                                                // 充值金额
    giveMoney    : {type: Number, default: 0},                                          // 赠送金额
    mode : {type: Number, default: 1},                                                  // 充值方式     1.现金    2.银联卡   3.退款
    datetime : {type:Date, default: Date.now},                                          // 创建时间
    operator : {type: schema.Types.ObjectId, ref:'staff'},                              // 操作员
    remark: {type: String},                   		                                    // 备注
    isUpload: {type: Boolean, default: false},                                          // 是否上传了
    isDel: {type: Boolean, default: false}                                              // 是否删除了
});

RechargeLogSchema.index({diningMemberId: 1, datetime: 1, operator:1});
RechargeLogSchema.index({mode: 1});
RechargeLogSchema.index({diningMemberId: 1});
RechargeLogSchema.index({operator:1});
RechargeLogSchema.index({datetime:1});
RechargeLogSchema.index({datetime:1,operator:1});

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

validate.add('amount', {
    required: true,
    msg: '充值金额不能为空'
});

mongooseValidateFilter.validateFilter(RechargeLogSchema, validate, filter);
mongoose.model('rechargeLog', RechargeLogSchema);