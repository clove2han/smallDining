/**
 * 2014/10/16
 * @module models/dishOrder
 * @description 菜品订单数据模型
 * @author 冀玉鑫
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

/**
 * 菜品订单表模型
 * @type {schema}
 */
var dishesOrderSchema = new schema({
    orderId: {type: schema.Types.ObjectId, ref: 'restOrders'},        // 订单号
    dishTypeId: {type: schema.Types.ObjectId, ref: 'dishesType'},     // 菜品类型ID
    dishesId: {type: schema.Types.ObjectId, ref: 'dishes'},           // 菜品ID
    pattern: {type: Number},                                          // 模式(1.酒楼模式，2.酒楼快餐模式. 3.快餐模式，)
    waiter:{type:String},                                             // 服务员(下单时生成)
    name: {type: String},                                             // 菜品名称
    quantity: {type: Number},                                         // 数量
    price: {type: Number},                                            // 单价
    createTime: {type: Date, default: Date.now},                      // 创建时间
    state: {type: Number, default: 0},                                // 状态 ( 0:待做  1:正在做菜  2:催菜 3:已做完 4:已上菜, 5:已退完所有数量)
    flavor: [{type:String}],                                          // 口味
    goUpNum: {type:Number, default:0},                                // 已经上的个数
    recedeNum: {type: Number, default: 0},                            // 退的数量
    type: {type: Number, default: 1},                                 // 3团购, 2.外卖, 1堂食

    number: {type: Number, default: 0},                               // 划菜数量  0~ 代表已划菜数量
    finishNumber: {type: Number, default: 0},                         // 做菜完成数量  0~ 代表已做菜完成数量

    remark: {type: String, default: ""},                              // 备注
    isPackage: {type:Boolean, default: false},                        // 是否是套餐

    packageContent: [{                                                // 套餐已点的内容
        type: schema.Types.ObjectId, ref: 'dishesOrder'
    }],
    pendingTransactions: [{type: schema.Types.ObjectId, ref: 'transaction'}],
    isNeedCook: {type: Boolean, ref: true},                       // 是否需要做菜
    isUpload: {type: Boolean, default: false},                      // 是否上传了
    isDel: {type: Boolean, default: false}                          // 是否删除了
});

dishesOrderSchema.index({orderId: 1});
dishesOrderSchema.index({dishTypeId: 1});
dishesOrderSchema.index({orderId: 1, pattern: 1});
dishesOrderSchema.index({waiter: 1});
dishesOrderSchema.index({state: 1, pattern: 1});
dishesOrderSchema.index({createTime:1,dishTypeId:1});
dishesOrderSchema.index({createTime:1,dishTypeId:1,recedeNum:1});
dishesOrderSchema.index({createTime:1,recedeNum:1});
dishesOrderSchema.index({createTime:1});

// ------ 菜品订单ID修改验证 ------
validate.add('_id',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isUpdate || this.__isRemove) {
            this.model('dishesOrder').findOne({
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
    msg: '没有找到对应的已点菜品！'
});

// ------ 订单号验证 ------
validate.add('orderId',{
    required: true,
    msg: '订单ID不能为空！'
});

validate.add('orderId',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isCreate) {
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
    msg: '没有找到指定的订单！'
});

// ------ 菜品ID验证 ------
validate.add('dishesId',{
    required: true,
    msg: '菜品ID不能为空！'
});

validate.add('dishesId',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isCreate || this.__isUpdate) {
            this.model('dishes').findOne({
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
    msg: '没有找到指定的菜品！'
});

// ------ 菜品名称验证 ------
validate.add('name',{
    required: true,
    msg: '菜品名称不能为空！'
});
validate.add('name', {
    exist: true,
    type: 'string',
    msg: '菜品名称必须为字符型！'
});

// ------ 数量验证 ------
validate.add('quantity',{
    required: true,
    msg: '数量不能为空！'
});
validate.add('quantity', {
    exist: true,
    type: 'number',
    msg: '数量必须为数值型！'
});

// ------ 单价验证 ------
validate.add('price',{
    required: true,
    msg: '单价不能为空！'
});
validate.add('price', {
    exist: true,
    type: 'number',
    msg: '单价必须为数值型！'
});

// ------ 划菜数量验证 ------
validate.add('number', {
    exist: true,
    type: 'number',
    msg: '划菜数量必须为数值型！'
});
validate.add('$inc',{
    callback: function(value, respond) {
        if (this.__isUpdate) {
            this.model('dishesOrder').findOne({
                $where : "this.number + " + value.state + "> this.quantity"
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
    msg: '划菜数量超过已点数量！'
});

mongooseValidateFilter.validateFilter(dishesOrderSchema, validate, filter);

mongoose.model('dishesOrder', dishesOrderSchema);