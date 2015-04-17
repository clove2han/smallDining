/**
 * 2015/3/24
 * @module
 * @description     交接班记录
 * @author 冀玉鑫
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

var alternateLogSchema = new schema({
    operator : {type: schema.Types.ObjectId, ref:'staff'},              // 操作员
    startDate : {type: Date},                                           // 开始时间
    alternateDate    : {type: Date},                                    // 结束时间
    discountPrice : {type: Number, default: 0},                         // 折扣金额
    memberCashRecharge : {type: Number, default: 0},                    // 会员现金充值金额
    memberCUPRecharge : {type: Number, default: 0},                     // 会员银联充值金额
    memberBackPrice: {type: Number, default: 0},                        // 会员退款金额
    memberPay: {type: Number, default: 0},                              // 会员支付金额
    memberCancelPay: {type: Number, default: 0},                        // 会员退卡金额
    cashPay: {type: Number, default: 0},                                // 现金支付金额
    posPay: {type: Number, default: 0},                                 // pos支付金额
    count: {type: Number, default: 0},                                  // 总单数
    totalPrice: {type: Number, default: 0},                             // 原总金额
    cashBackPrice: {type: Number, default: 0},                          // 现金退款金额
    couponPay: {type: Number, default: 0},                              // 优惠券使用金额
    couponPrice: {type: Number, default: 0},                            // 优惠了多少钱
    realPrice: {type: Number, default: 0},                              // 现金总额
    confirmUser:{type:String},                                          //确认人
    isUpload: {type: Boolean, default: false},
    isDel: {type: Boolean, default: false}
});

alternateLogSchema.index({operator: 1});
alternateLogSchema.index({operator: 1, startDate: 1, alternateDate: 1});
alternateLogSchema.index({alternateDate:1,operator:1});
alternateLogSchema.index({alternateDate:1});


mongooseValidateFilter.validateFilter(alternateLogSchema, validate, filter);
mongoose.model('alternateLog', alternateLogSchema);