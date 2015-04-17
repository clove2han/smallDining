/**
 * 2014/10/20
 * @module        models/pointsRule
 * @description  积分规则表
 * @author       韩皎
 * @modified By
 */

var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

//积分规则模型对象, 积分规则只能有一条记录有效
var pointsRuleSchema = new schema({
    consumer       : {type:Number,default:1},          // 消费金额
    returnPoints   : {type:Number,default:1},          // 返还积分
    //isActive       : {type:Boolean}       // 是否有效
    date: {type: Date, default: Date.now},
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});
validate.add('consumer', {
    required: true,
    msg: "消费金额不能为空"
});

validate.add('consumer',{
    type :'number',
    msg:"消费金额必须为数字！"
});

validate.add('returnPoints', {
    required: true,
    msg: "返还积分不能为空"
});

validate.add('returnPoints',{
    type:'number',
    msg:'返还积分必须为数字！'
});

mongooseValidateFilter.validateFilter(pointsRuleSchema, validate, filter);
mongoose.model('pointsRule', pointsRuleSchema);