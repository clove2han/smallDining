/**
 * 2014/3/18
 * @module app/models/giveRule
 * @description 赠送规则
 * @author 冀玉鑫
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

//会员信息模型对象
var giveRuleSchema = new schema({
    maxAmount: {type:Number},                   // 最大金额
    minAmount: {type:Number},                   // 最小金额
    giveMoney: {type:Number},                   // 赠送积分
    isUpload: {type:Boolean, default: false},   // 是否同步
    isDel: {type:Boolean, default: false}       // 是否删除
});

//验证赠送积分
validate.add('giveMoney',{
    required:true,
    msg: '赠送积分不能为空！'
});
validate.add('giveMoney',{
    exist: true,
    type: 'number',
    msg: '赠送积分必须为数字！'
});

//等级金额验证
validate.add('minAmount',{
    required:true,
    msg: '等级最小金额不能为空！'
});

validate.add('minAmount',{
    exist: true,
    type: 'number',
    msg: '等级最小金额必须为数字！'
});
validate.add('maxAmount',{
    required:true,
    msg: '等级最大金额不能为空！'
});

validate.add('maxAmount',{
    exist: true,
    type: 'number',
    msg: '等级最大金额必须为数字！'
});
mongooseValidateFilter.validateFilter(giveRuleSchema, validate, filter);
mongoose.model('giveRule', giveRuleSchema);