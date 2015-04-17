/**
 * @module app/schema/merchant/shop.js
 * @description 店铺模型
 * @author 冀玉鑫
 * @modified By
 */

var mongoose = require('mongoose');
var schema = mongoose.Schema;
var mongooseValidateFilter = require('mongoose-validatefilter');
var validate = new mongooseValidateFilter.validate();
var filter = new mongooseValidateFilter.filter();

// 店铺信息
var shopSchema = new schema({
    merchantId : {type: schema.Types.ObjectId, ref: 'merchant'}  // 商家ID
    ,shopTypeId : {type: schema.Types.ObjectId, ref: 'shopType'} // 店铺类型
    ,name  : {type: String}                                 // 店铺名称
    ,address  : {type: String}                              // 店铺地址
    ,createTime  : {type: Date}                             // 创建时间
    ,describe  : {type: String}                             // 店铺描述
    ,province  : {type: String}                             // 所属省份
    ,city  : {type: String}                                 // 所属城市
    ,area  : {type: String}                                 // 所属行政区
    ,startBusiness  : {type: String}                        // 开始营业时间
    ,endBusiness  : {type: String}                          // 结束营业时间
    ,notice  : {type: String}                               // 公告
    ,phone  : {type: String}                                // 联系电话
    ,picture  : {type: String}                              // 图片
    ,isInvoice  : {type: Boolean}                           // 是否支持发票
    ,sendPrice  : {type: Number}                            // 起送价格
    ,businessPhone: {type: String}                          // 业务电话
    ,isPayOnDelivery: {type: Boolean}                       // 是否支持货到付款
    ,reserveTime: {type: Number}                            // 预留时间（外卖时送餐准备时间）
    ,mainBusiness: {type: String}                           // 主营业务
    ,startDelivery: {type: String}                          // 开始派送外卖时间
    ,endDelivery: {type: String}                            // 结束派送外卖时间
    ,shipPrice  : {type: Number, default: 0}                // 配送价格
    ,freePrice: {type: Number}                              // 免费费用 ： 订单价格超过指定费用后，不收取派送费用
    ,isAtOnceDelivery: {type: Boolean, default: false}      // 是否支持马上派送
    ,avgConsumer: {type: String, default: 0}                // 人均消费
    ,shipTime: {type: Number}                               // 订购时间（支持指定天数内的订购,单位：天）
    ,position: [{type:Number},{type:Number}]                // 坐标点
    ,isReserve: {type: Boolean, default: false}              // 是否支持预订
    ,isTakeOut: {type: Boolean, default: false}              // 是否支持外卖
    ,isGroupBuy: {type: Boolean, default: false}             // 是否支持团购
    ,isVoucher: {type: Boolean, default: false}              // 是否支持代金券
    ,isOrderDishes:{type: Boolean, default: false}           // 是否支持点菜
    ,requestNumber:{type: String}            // 请求串号
    ,grade: {type: Number, default: 0} ,      // 平均评分
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});

shopSchema.index({position: "2d"});

// ------ 店铺ID修改验证 ------
validate.add('_id',{
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isUpdate || this.__isRemove) {
            this.model('shop').findOne({
                _id: value
            }, function(e, doc) {
                if (e) return respond(e);
                if(doc){
                    respond(true);
                }else{
                    respond(false);
                }
            });
        } else {
            respond(true);
        }
    },
    msg: '没有找到对应的店铺！'
});
validate.add('_id',{
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isRemove) {
            this.model('dishes').findOne({
                shopId: value
            }, function(e, doc) {
                if (e) return respond(e);
                if(doc){
                    respond(false);
                }else{
                    respond(true);
                }
            });
        } else {
            respond(true);
        }
    },
    msg: '该店铺下还有菜品信息，无法删除！'
});

// ------ 商家验证 ------
validate.add('merchantId',{
    required: true,
    msg: '商家不能为空！'
});
// ------ 店铺名称验证 ------
validate.add('name',{
    required: true,
    msg: '店铺名称不能为空！'
});
validate.add('name',{
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isCreate) {
            this.model('shop').findOne({
                name: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '店铺名称名称重复！'
});
validate.add('name', {
    exist: true,
    type: 'string',
    msg: '店铺名称必须为字符串格式！'
});

// ------ 店铺地址验证 ------
validate.add('address',{
    required: true,
    msg: '店铺地址不能为空！'
});

// ------ 所属省份验证 ------
validate.add('province',{
    required: true,
    msg: '所属省份不能为空！'
});

// ------ 所属城市验证 ------
validate.add('city',{
    required: true,
    msg: '所属城市不能为空！'
});

// ------ 所属地区验证 ------
validate.add('area',{
    required: true,
    msg: '所属地区不能为空！'
});

// ------ 联系电话验证 ------
validate.add('phone',{
    required: true,
    msg: '联系电话不能为空！'
});
validate.add('phone', {
    regExp: /^1[3|4|5|8][0-9]\d{8}$/,
    msg: '联系电话格式不正确！'
});

// ------ 起送价格验证 ------
validate.add('shipPrice', {
    exist: true,
    type: 'Number',
    msg: '起送价格必须为数字格式！'
});

// ------ 配送价格验证 ------
validate.add('sendPrice', {
    exist: true,
    type: 'Number',
    msg: '配送价格必须为数字格式！'
});
// ------ 免费费用验证 ------
validate.add('freePrice', {
    exist: true,
    type: 'Number',
    msg: '免费费用必须为数字格式！'
});
// ------ 人均消费验证 ------
validate.add('avgConsumer', {
    exist: true,
    type: 'Number',
    msg: '人均消费必须为数字格式！'
});
// ------ 订购时间验证 ------
validate.add('shipTime', {
    exist: true,
    type: 'Number',
    msg: '订购时间必须为数字格式！'
});
// ------ 预留时间验证 ------
validate.add('reserveTime', {
    exist: true,
    type: 'Number',
    msg: '预留时间必须为数字格式！'
});
mongooseValidateFilter.validateFilter(shopSchema, validate, filter);
mongoose.model('shop', shopSchema);