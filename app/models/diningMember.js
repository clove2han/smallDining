/**
 * 2014/10/12
 * @module models/diningMember
 * @description 会员信息数据模型
 * @author 韩皎
 * @modified By
 */

var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

//会员信息模型对象
var diningMemberSchema = new schema({
    membNo       : String,      // 会员卡号
    smallNo      : String,      //小猫钱包帐号
    //password     : {type:String},                                             // 密码          最少6个字符
    state        : {type:Number, default: 0},                                   // 状态          正常：0 挂失：1 注销：2
    membLevelId  : {type: schema.Types.ObjectId, ref: 'memberLevel'},           // 会员等级     关联等级表
    name         : {type:String},                                               // 姓名          不超过10个字符
    tel          : {type:Number},                                               // 手机号码
    prepayments  : {type:Number,default:0},                                     // 预付款金额     验证数据类型为number
    giveMoney    : {type: Number, default: 0},                                  // 赠送金额
    points       : {type:Number,default:0},                                     // 积分          验证数据类型为number
    datetime     : {type:Date, default: Date.now},                              // 创建时间
    cancelTime     : {type:Date, default: Date.now},                            // 注销时间
    remark       : {type:String},                                               // 备注
    pendingTransaction:  [{type: schema.Types.ObjectId, ref: 'transatcion'}],   //事务的ID
    pendingTransactions: [{type: schema.Types.ObjectId, ref: 'transaction'}],   //已经回滚过的ID
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});
diningMemberSchema.index({membNo: 1});
diningMemberSchema.index({tel: 1});
diningMemberSchema.index({isDel:1,state:1});

//验证会员卡号
validate.add('membNo',{
    exist: true,
    type: 'String',
    msg: '会员卡号不能为空！'
});

validate.add('membNo', {
    exist: true,
    callback: function(value, respond) {
        value = String(value).trim();
        // 这里有3个判断值，分别为：
        // __isCreate: 执行 cretaOne 时为真
        // __isUpdate: 执行 updateOne 时为真
        // __isRemove: 执行 removeOne 时为真
        if (this.__isCreate) {
            this.model('diningMember').findOne({
                membNo: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '会员卡号已经存在！'
});

//密码验证
/*validate.add('password', {
    exist: true,
    trim: true,
    minLength: 6,
    msg: '密码长度至少为6个字符'
});*/

//姓名长度验证
//validate.add('name', {
//    required: true,
//    msg: '姓名不能为空'
//});
//
//validate.add('name', {
//    trim: true,
//    minLength:0,
//    maxLength: 5,
//    msg: '姓名长度不超过5个字符'
//});

//手机号码的验证
//validate.add('tel', {
//    required: true,
//    msg: '手机号码不能为空'
//});

//validate.add('tel', {
//    type: 'number',
//    msg: '手机号码必须是数字类型'
//});
//
//validate.add('tel', {
//    callback: function (value, respond) {
//        var reg = /^0?(13[0-9]|15[012356789]|18[0-9]|14[57])[0-9]{8}$/;
//        if(reg.test(value)){
//             respond(true);
//        }else{
//             respond(false);
//        }
//    },
//    msg: '手机号码格式不正确'
//});

validate.add('membLevelId',{
    required: true,
    msg: '会员等级必须的'
});

validate.add('membLevelId', {
   callback: function (value, respond) {
       value = value.trim();
       if(this.__isCreate || this.__isUpdate){
           this.model('memberLevel').findOne({
               _id: value
           }, function (e, doc) {
               if(e) return respond(e);
               if(doc._id){
                   respond(true)
               }else{
                   respond(false)
               }
               //respond(!doc);
           })
       }else{
            respond(true)
       }
   },
    msg: '会员等级不存在'
});


//验证预付款金额
validate.add('prepayments', {
    exist:true,
    type: 'number',
    msg: '预付款必须为数字！'
});
//验证赠送金额
validate.add('giveMoney', {
    exist:true,
    type: 'number',
    msg: '赠送金额必须为数字！'
});
//验证积分
validate.add('points', {
    exist:true,
    type: 'number',
    msg: '积分必须为数字！'
});
mongooseValidateFilter.validateFilter(diningMemberSchema, validate, filter);
mongoose.model('diningMember', diningMemberSchema);