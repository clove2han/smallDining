/**
 * @module app/schema/merchant.js
 * @description 商家用户 数据模型
 * @author 韩皎
 * @modified By
 */

var mongoose = require('mongoose');
var schema = mongoose.Schema;
var utils = require('utility');
var mongooseValidateFilter = require('mongoose-validatefilter');
var validate = new mongooseValidateFilter.validate();
var filter = new mongooseValidateFilter.filter();


// 公司信息表
var MerchantSchema = new schema({
    s_id           : {type:String},             // 小猫账号的_id    不能为空， 唯一
    smallId        : {type:String,unique:true}, // 小猫帐号
    cName          : {type:String},             // 公司名称
    cType          : {type:String},             // 公司类型      非空
    cContacter     : {type:String},             // 公司联系人
    cTel           : {type:String},             // 电话          非空
    cAddress       : {type:String},             // 地址          非空
    cEmail         : {type:String},             // 邮箱           非空
    cBLNo          : {type:String},             // 营业执照代码
    cBLPic         : {type:String},             // 营业执照扫描件
    cBLDate        : {type:Date},               // 营业执照有效期
    cBCNo          : {type:String},             // 食品经营许可证代码
    cBCPic         : {type:String},             // 食品经营许可证扫描件
    cBCDate        : {type:Date},               // 食品经营许可证有效期
    cLegal         : {type:String},             // 法人代表         非空
    cAccountBank   : {type:String},             // 开户行           非空  通过之后在完善的信息
    cAccountName   : {type:String},             // 开户名           非空  通过之后在完善的信息
    cAccountNo     : {type:String},             // 银行帐号           非空  通过之后在完善的信息
    cDescribe      : {type:String},             // 公司描述
    applyTime      : {type:Date},               // 申请时间
    verifyState    : {type:Number,default:2},   // 审核状态     0：未通过，1，通过，2 待审核
    verifyMsg      : {type:String},             // 审核结果
    verifyTime     : {type:Date},               // 审核时间
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});

MerchantSchema.index({s_id: 1}, {unique: true});

// ------ 小猫帐号验证 ------
validate.add('s_id',{
    required: true,
    msg: '帐号_id不能为空!'
});

validate.add('s_id', {
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isCreate) {
            this.model('merchant').findOne({
                s_id: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '帐号已经被注册！'
});

validate.add('cTel', {
    required: true,
    msg: '联系电话不能为空'
});

validate.add('cAddress', {
    required: true,
    msg: '公司地址不能为空'
});

validate.add('cEmail',{
    required:true,
    msg:'电子邮箱不能为空！'
});

validate.add('cEmail', {
    type: 'string',
    msg: '邮箱必须为字符串格式！'
});

validate.add('cEmail', {
    type: 'email',
    msg: '邮箱格式不正确！'
});

validate.add('cEmail', {
    maxLength: 120,
    msg: '邮箱长度不能超过120个字符！'
});

validate.add('cEmail', {
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isCreate) {
            this.model('merchant').findOne({
                cEmail: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '电子邮箱已经被注册！'
});


//validate.add('TRCP',{
//    required:true,
//   msg:'税务登记代码图片不能为空！'
//});
//validate.add('OZCP',{
//    required:true,
//    msg:'营业执照图片不能为空！'
//});
//validate.add('BLP',{
//    required:true,
//    msg:'税务登记代码图片不能为空！'
//});

mongooseValidateFilter.validateFilter(MerchantSchema, validate, filter);
mongoose.model('merchant', MerchantSchema);