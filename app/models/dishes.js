/**
 * 2014/10/12
 * @module models/dishes
 * @description 菜品信息数据模型
 * @author 冀玉鑫
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter(),
    util = require('util'),
    _ = require('underscore');

var activityType = ['RECOMMEND', 'PRESENT', 'BARGAIN', 'NORMAL'];

//菜品信息模型对象
var dishesSchema = new schema({
    name: {type: String},                                          //菜品名称
    abbr: {type: String},                                          //名称缩写
    typeId: {type: schema.Types.ObjectId, ref: 'dishesType'},      //菜品类型
    activityType: {type: String},                                  //活动类型（'RECOMMEND': 推荐菜,'PRESENT': 赠送菜, 'BARGAIN': '特价菜', 'NORMAL': 正常）
    imgName: {type: String},                                       //图片
    price: {type: Number},                                         //单价
    intro: {type: String},                                         //菜品简介
    flavorId: [{type: schema.Types.ObjectId, ref: 'flavor'}],	   //口味
    salePrice: {type: Number, default: 0},                         //特价
    saleType: {type: Number, default: 1},                          //销售类型(1:全部, 2:外卖, 3:预定)
    state: {type: Number, default: 1},                             //销售状态(1:正常, 2:洁清, 3:停售)
    salesVolume: {type: Number, default: 0},                       //销量
    remark: {type: String},                                        //备注
    createDate: {type: Date,default: Date.now()},                  //创建时间（默认当前时间）
    sort: {type: Number, default: 9999},                           //显示顺序
    surplus: {type: Number, default: 0},                           //可供数量（默认值：0） 正常库存
    haveOnNumber: {type: Number, default: 0},                      //已点数量 需求
    goingSurplus: {type: Number, default: 0},                      //（默认值：0） 外卖库存
    goingHaveOnNumber: {type: Number, default: 0},                 //已点数量 外卖需求
    supplyTimeId: [{type: schema.Types.ObjectId, ref: 'supplyTime'}],  //按就餐时间划分类型 （'早餐'、‘中餐’、‘下午茶’、‘晚餐’、‘夜宵’）

//    setMeal: {                                                              //套餐内容
//        packagePrice: {type: Number, default: -1},                          //套餐价格
//        content: [{
//            name: {type: String, default:""},                               //名称
//            sort: {type: Number, default:1},                                //排序
//            optional: {type: Number, default:0},                            //可选数
//            list:[{
//                type: schema.Types.ObjectId, ref: 'dishes'
//            }]
//        }]
//    },
//    packagePrice: {type: Number, default: 0},                          //套餐价格

    packageContent: [{
        name: {type: String},                                           //名称
        sort: {type: Number, default:1},                                //排序
        optional: {type: Number, default:0},                            //可选数
        list:[{
            type: schema.Types.ObjectId, ref: 'dishes'
        }]
    }],    //套餐内容
    isPackage: {type:Boolean, default: false},                      //是否是套餐
    isNeedCook: {type: Boolean, default: true},                     // 是否需要厨师 true：需要 false：不显示到厨师端
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});

dishesSchema.index({name: 1}, {unique: true});
dishesSchema.index({typeId: 1});
dishesSchema.index({activityType: 1});
dishesSchema.index({state: 1});
dishesSchema.index({activityType: 1, typeId: 1});

// ------ 菜品ID修改验证 ------
validate.add('_id',{
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isUpdate || this.__isRemove) {
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
    msg: '没有找到对应的菜品！'
});

// ------ 口味验证 ------
validate.add('flavorId',{
    callback: function(value, respond) {
        if (this.__isCreate || this.__isUpdate) {
            if(!value) respond(true);
            else{
                var query = {};

                if(util.isArray(value)){
                    query = {_id:{"$in" : value}};

                } else if(typeof value == "string"){
                    query = {_id:String(value).trim().toLowerCase()};
                }
                this.model('flavor').findOne(query, function(e, doc) {
                    if (e) return respond(e);
                    if(doc){
                        respond(true);
                    }else{
                        respond(false);
                    }
                });
            }
        } else {
            respond(true);
        }
    },
    msg: '没有找到指定的口味！'
});


validate.add('name',{
    required: true,
    msg: '菜品名称不能为空！'
});
validate.add('name', {
    exist: true,
    type: 'string',
    msg: '菜品名称必须为字符串格式！'
});
validate.add('name', {
    exist: true,
    trim: true,
    minLength: 0,
    maxLength: 100,
    msg: '菜品名称长度至多为100个字符'
});
validate.add('name',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isCreate) {
            this.model('dishes').findOne({
                name: value
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
    msg: '菜品名称重复！'
});

// ------ 名称缩写验证 ------
validate.add('abbr',{
    type: 'string',
    msg: '名称缩写必须为字符串格式！'
});

// ------ 菜品类型验证 ------
validate.add('typeId',{
    required: true,
    msg: '菜品类型不能为空！'
});
validate.add('typeId',{
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isCreate || this.__isUpdate) {
            this.model('dishesType').findOne({
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
    msg: '没有找到指定的菜品类型！'
});

// ------ 单价验证 ------
validate.add('price',{
    required: true,
    msg: '单价不能为空！'
});
validate.add('price', {
    exist: true,
    type: 'number',
    msg: '菜品名称必须为数值型！'
});

// ------ 菜品简介 ------
validate.add('intro',{
    exist: true,
    type: 'string',
    msg: '菜品简介必须为字符串形式！'
});
validate.add('intro', {
    exist: true,
    trim: true,
    minLength: 0,
    maxLength: 500,
    msg: '菜品简介长度至多为500个字符'
});

// ------ 特价验证 ------
validate.add('salePrice',{
    required: true,
    msg: '特价不能为空！'
});
validate.add('salePrice', {
    exist: true,
    type: 'number',
    msg: '特价必须为数值型！'
});

// ------ 销量验证 ------
validate.add('salesVolume',{
   exist: true,
    type: 'number',
    msg: '销量必须为数值型'
});

// ------ 可供数量验证 ------
validate.add('surplus',{
    exist: true,
    type: 'number',
    msg: '可供数量必须为数值型'
});

// ------ 备注验证 ------
validate.add('remark',{
    exist: true,
    type: 'string',
    msg: '备注必须为字符类型'
});

// ------ 排序号验证 ------
validate.add('sort', {
    exist: true,
    type: 'number',
    msg: '排序号必须为数值型！'
});

//判断供应时间
validate.add('activityType',{
    callback: function (value, respond) {
        if(_.indexOf(activityType, value) == -1){
            respond(false);
        }else{
            respond(true);
        }
    },
    msg: "活动类型有误"
});

mongooseValidateFilter.validateFilter(dishesSchema, validate, filter);

mongoose.model('dishes', dishesSchema);