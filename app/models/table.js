/**
 * @module       models/table
 * @description  台位信息表
 * @author
 * @modified By 韩皎
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

/* ***********************
 * 表名:台位表 table
 * 字段:
 *     台名称，不一定是数字
 *     显示顺序
 *     状态:1.空闲  2.已预定 3.已开台 4.点菜中 5.已点菜 6.正在上菜 7.待结账 8.已结账
 *     备注
 * **************************************/
var tableSchema = new schema({
    name           : {type: String},                                        //台位名称
    tableTypeId    : {type: schema.Types.ObjectId, ref: 'tableType'},       //台位类型ID
    orderId        : {type: String, default:""},                            //临时订单号
    sort           : {type: Number, default: 999},                          //显示顺序
    state          : {type: Number, default:1},                             //台位状态
    mealsNumber    : {type: Number, default:0},                             //目前就餐人数
    openDate       : {type: Date},                                          //开台时间
    pendingTransactions: [{type: schema.Types.ObjectId, ref: 'transaction'}],   //回滚过的事务
    remark         : {type: String},                                        //备注
    isUpload       : {type: Boolean, default: false},                       //是否上传了
    isDel          : {type: Boolean, default: false}                        //是否删除了
});

tableSchema.index({name:1});
tableSchema.index({tableTypeId:1});
tableSchema.index({sort:1});

// ------ 台位名称验证 ------
validate.add('name',{
    required: true,
    msg: '台位名称不能为空！'
});
// ------ 台位类型验证 ------
validate.add('tableTypeId',{
    required: true,
    msg: '台位类型不能为空！'
});
validate.add('tableTypeId',{
    callback: function(value, respond) {
        if (this.__isCreate || this.__isUpdate) {
            this.model('tableType').findOne({
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
    msg: '没有找到指定的台位类型！'
});
// ------ 排序号验证 ------
validate.add('sort', {
    exist: true,
    type: 'Number',
    msg: '排序号必须为数值型！'
});

// ------ 状态验证 ------
/*validate.add('state', {
    exist: true,
    type: 'Number',
    msg: '台位状态必须为数值型！'
});*/
//台位添加验证
validate.add('name',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isCreate) {
            this.model('table').findOne({
                name: value
            }, function(e, doc) {
                if (e) return respond(e);
                return respond(!doc);
            });
        } else {
           return respond(true);
        }
    },
    msg: '台位名称重复！'
});


// ------ 台位修改验证 ------
validate.add('_id',{
    callback: function(value, respond) {
        if (this.__isUpdate || this.__isRemove) {
            this.model('table').findOne({
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
    msg: '没有找到台位！'
});
mongooseValidateFilter.validateFilter(tableSchema, validate, filter);
mongoose.model('table', tableSchema);