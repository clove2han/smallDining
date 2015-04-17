/**
 * 2014/10/16
 * @module models/restOrders
 * @description 餐厅订单数据模型
 * @author 冀玉鑫
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter(),
    _ = require('underscore');


var paymentMethods = [1,2,3,4,5,6,7,8,9]; //(1:现金，2: 支付宝, 3: 微信支付， 4: 银联，5: 优惠券 6:会员卡支付 7:小猫支付 8:免单支付 9:美餐支付)

/**
 * 餐厅订单表模型
 * @type {schema}
 */
var restOrdersSchema = new schema({
    orderNumber: {type: String, unique: true},                                  //订单号
    orderState: {type: Number, default: 0},                                     //订单状态 (0:待结账 1:已结账, 2:叫起)
    orderType: {type: Number},                                                  //订单类型 (1:餐厅 2:外卖 3:团购)
    pattern: {type: Number},                                                    //模式(1.酒楼模式，2.酒楼快餐模式. 3.快餐模式，)
    diningMemberId: {type: schema.Types.ObjectId, ref: 'diningMember'},         //会员信息
    createDate: {type: Date, default: Date.now} ,                               //创建时间
    cashier: {name: {type: String}, cashierId: {type: schema.Types.ObjectId, ref: 'staff'}}, //买单操作员
    waiter: {type: String},                                                     //点菜操作员
    foundingInfo:{                                                              //开台信息
        foundingTime:{type: Date},                                              //开台时间
        diningTableId:{type: schema.Types.ObjectId, ref: 'table'},              //台位信息
        diningTableName:{type: String},                                         //台位名称
        mealsNumber:{type: Number}                                              //就餐人数
    },
    deliverInfo:{                                           //外卖信息
        linkman:{type: String},                             //联系人
        deliverTime:{type: Date},                           //配送时间
        deliverAddr:{type: String},                         //配送地址
        deliverState:{type: String},                        //配送状态
        deliver:{type: String},                             //配送人
        telephone:{type: String},                           //手机号码
        isPayOnDelivery:{type: Boolean},                    //是否到付
        state: {type: Number},                              //外卖订单状态( 1.下单 2.店家确认 3.催单 4.送出  5.过期  6.完成)
        isUrging: {type: Boolean, default: false},          //是否催单
        orderTime: {type: Date}                             //外卖订单生成时间
    },
    groupbuyInfo:{                                          //团购信息
        goodsName:{type: String},                           //商品
        goodsNumber:{type: Number},                         //数量
        telephone:{type: String},                           //手机号码
        validityPeriod:{type: Date},                        //有效期
        verifyCode:{type: String}                           //团购卷密码
    },
    totalPrice: {type: Number, default: 0},                 //总价
    //memberPrice: {type: Number, default: 0},              //会员价
    discount: {type: Number, default:1},                    //折扣
    discountPrice: {type: Number},                          //折扣价
    isFree: {type: Boolean, default: false},                //是否免单
    backPoints: {type: Number, default: 0},                 //返还积分
    isInvoice: {type: Boolean, default: false},             //是否开发票
    payment: [{                                             //付款方式
        paymentMethod:{type: Number},                       //支付方式(1:现金，2: 支付宝, 3: 微信支付， 4: 银联，5: 优惠券 6:会员卡支付 7:小猫支付 8:免单支付 9:美餐支付)
        paymentId: {type: String},                          //支付方式的帐号
        price:{type: Number}                                //金额
    }],
    refund:[{                                               //退款方式
        staffCardId: {type: String},                        //退菜操作人
        paymentMethod:{type: Number},                       //退款方式(1:现金，2: 支付宝, 3: 微信， 4: 银联，5: 优惠 6:会员卡  7:小猫支付 8:免单支付)
        paymentID: {type: String},                          //退款到的帐号
        price:{type: Number}                                //金额
    }],
    //退单相关
    backState: {type:Number, default: 0}                    // 退单状态         0：正常 1：申请退单  2：退单成功 3:退单失败
    ,backTime: {type: Date}                                 // 退单时间

    //线上申请
    ,onLineChangeBackApply : {
        applyTime: {type: Date}                             // 退单申请时间
        ,changeBackCause: {type: String}                    // 退单原因
        ,feedbackTime: {type: Date}                         // 退单反馈时间
        ,repulseInfo: {type: String}                        // 反馈信息
    }
    //线下申请
    ,offlineChangeBackApply : {
        feedbackTime: {type: Date}                          // 退单反馈时间
        ,repulseInfo: {type: String}                        // 退单说明
        ,source: {type: String}                             // 退单来源
    },
    isPack: {type: Boolean , default: false},               //是否打包
    payDate: {type: Date},                                  //付款时间
    ongoing: {type: Boolean, default: false},               //订单是否进行中
    isDone: {type: Boolean, default: false},                //订单是否完成
    isUpload: {type: Boolean, default: false},              //是否上传了
    isDel: {type: Boolean, default: false}                  //是否删除了
});

restOrdersSchema.index({orderNumber: 1}, {unique: true});
//收银订单查询索引
restOrdersSchema.index({orderType: 1, pattern: 1, isDone: 1});
restOrdersSchema.index({orderType: 1, pattern: 1, orderNumber: 1, isDone: 1});
restOrdersSchema.index({orderType: 1, pattern: 1, "foundingInfo.diningTableName": 1, isDone: 1});

restOrdersSchema.index({diningMemberId: 1});
restOrdersSchema.index({mode: 1});
restOrdersSchema.index({operator: 1});
restOrdersSchema.index({pattern: 1});
restOrdersSchema.index({createDate: 1});
restOrdersSchema.index({isPack: 1});
restOrdersSchema.index({payDate: 1});
restOrdersSchema.index({isDone: 1});
restOrdersSchema.index({orderType: 1});
restOrdersSchema.index({orderState: 1});
restOrdersSchema.index({isFree: 1});
restOrdersSchema.index({"foundingInfo.diningTableName": 1});
restOrdersSchema.index({createDate:1,"cashier.cashierId":1});
restOrdersSchema.index({createDate:1,"refund.staffCardId":1});
restOrdersSchema.index({createDate:1,"cashier.cashierId":1,isDel:1,orderState:1});
restOrdersSchema.index({createDate:1,isDel:1,orderState:1});

// ------ 菜品类型ID修改验证 ------
validate.add('_id',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isUpdate) {
            this.model('restOrders').findOne({
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
    msg: '没有找到对应的订单！'
});

// ------ 订单号验证 ------
validate.add('orderNumber',{
    required: true,
    msg: '菜品类型名称不能为空！'
});
validate.add('orderNumber',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isCreate || this.__isUpdate) {
            this.model('restOrders').findOne({
                name: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '订单号重复！'
});
validate.add('orderNumber', {
    exist: true,
    type: 'string',
    msg: '订单号必须为字符串格式！'
});

// ------ 排序号验证 ------
validate.add('orderState', {
    exist: true,
    type: 'number',
    msg: '订单状态必须为数值型！'
});
// ------ 排序号验证 ------
validate.add('mealsNumber', {
    exist: true,
    type: 'number',
    msg: '就餐人数必须为数值型！'
});

// ------ 开台信息验证 ------
validate.add('foundingInfo',{
    exist: true,
    callback: function(value, respond) {
        if(value){
            if ((this.__isCreate || this.__isUpdate) && value.diningTableId) {
                this.model('table').findOne({
                    _id: value.diningTableId
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
        }else{
            respond(true);
        }
    },
    msg: '没有找到指定的台位信息！'
});

validate.add('payment',{
    callback: function(value, respond) {
        var result = true;
        if(_.isArray(value)){
            for(var i = value.length-1; i >= 0; i--){

                if(_.indexOf(paymentMethods, value[i].paymentMethod) == -1){
                    result = false;
                }
            }
            return respond(result);
        }else{
            respond(true);
        }

    },
    msg: '支付方式不存在'
});

validate.add('diningMemberId', {
    exist: true,
    callback: function (value, respond) {
        if(value){
            this.model('diningMember').find({
                _id: value
            }, function (e, doc) {
                if(e) return respond(e);
                if(doc.length > 0){
                    respond(true)
                }else{
                    respond(false)
                }
            })
        }else{
            respond(true)
        }
    },
    msg: '会员不存在'
});

/******添加外卖订单数据验证*******/
validate.add('deliverInfo', {
    callback: function (value, respond) {
        if(value){

            if(String(value.linkman).length > 0){
                respond(true)
            }else{
                respond(false)
            }
        }else{
            respond(true)
        }
    }
    ,msg: '外卖联系人不能为空'
});

validate.add('deliverInfo', {
    callback: function (value, respond) {
        if(value){
            if(String(value.deliverTime).length > 0){
                respond(true)
            }else{
                respond(false)
            }
        }else{
            respond(true)
        }


    }
    ,msg: '配送时间不能为空'
});

validate.add('deliverInfo', {
    callback: function (value, respond) {
        if(value){
            if(String(value.deliverAddr).length > 0){
                respond(true)
            }else{
                respond(false)
            }
        }else{
            respond(true)
        }

    }
    ,msg: '配送地址不能为空'
});

validate.add('deliverInfo', {
    callback: function (value, respond) {
        if(value){
            if(String(value.deliver).length > 0){
                respond(true)
            }else{
                respond(false)
            }
        }else{
            respond(true)
        }

    }
    ,msg: '配送人不能为空'
});

validate.add('deliverInfo', {
    callback: function (value, respond) {
        if(value){
            var reg = /^0?(13[0-9]|15[012356789]|18[0-9]|14[57])[0-9]{8}$/;
            if(reg.test(value.telephone)){
                respond(true);
            }else{
                respond(false);
            }

        }else{
            respond(true)
        }

    }
    ,msg: '外卖联系电话有误'
});

validate.add('cashier', {
    callback: function (value, respond) {
        if(value){
            if(value.cashierId){
                this.model('staff').find({
                    _id: value.cashierId
                }, function (e, doc) {
                    if(e) return respond(e);
                    if(doc.length > 0){
                        respond(true)
                    }else{
                        respond(false)
                    }
                })
            }else{
                respond(false);
            }

        }else{
            respond(true)
        }

    }
    ,msg: '收银员不存在'
});

validate.add('cashier', {
    callback: function (value, respond) {
        if(value){
            if(value.name){
                respond(true);
            }else{
                respond(false);
            }

        }else{
            respond(true)
        }
    }
    ,msg: '收银员名称不能为空'
});

mongooseValidateFilter.validateFilter(restOrdersSchema, validate, filter);
mongoose.model('restOrders', restOrdersSchema);