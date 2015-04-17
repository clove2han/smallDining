/**
 * 2014/10/20
 * @module models/memberLevel
 * @description 会员等级表
 * @author 韩皎
 * @modified By
 */

var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

//会员信息模型对象
var memberLevelSchema = new schema({
    name        : {type:String, unique:true},    // 会员等级名称   名称唯一，不重复
    minAmount   : {type:Number},                // 等级最小金额
    maxAmount   : {type:Number},                // 等级最大金额
    discounts   : {type:Number},                // 享受折扣
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});

memberLevelSchema.index({name:1});

//验证等级名称
validate.add('name',{
    required:true,
    msg: '会员等级名称不能为空！'
});

//会员等级名称
validate.add('name',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isCreate || this.__isUpdate) {
            this.model('memberLevel').findOne({
                name: value
            }, function(e, doc) {
                if (e) return respond(e);
                return respond(!doc);
            });
        } else {
            return respond(true);
        }
    },
    msg: '等级名称已存在！'
});

//等级金额验证
validate.add('minAmount',{
    required:true,
    msg: '等级金额不能为空！'
});

validate.add('minAmount',{
    exist: true,
    type: 'number',
    msg: '金额必须为数字！'
});

//等级金额验证
validate.add('maxAmount',{
    required:true,
    msg: '等级金额不能为空！'
});

validate.add('maxAmount',{
    exist: true,
    type: 'number',
    msg: '金额必须为数字！'
});

validate.add('discounts',{
    exist: true,
    type: 'number',
    msg: '折扣必须为数字！'
});

validate.add('discounts',{
    exist: true,
    type: 'number',
    max:1,
    msg: '折扣不能大于1！'
});


mongooseValidateFilter.validateFilter(memberLevelSchema, validate, filter);
mongoose.model('memberLevel', memberLevelSchema);