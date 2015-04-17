/**
 * @module proxy/diningMember
 * @description 餐厅会员信息DAO
 * @author 韩皎
 * @modified By
 */

var models = require(MODELS);
var diningMember = models.diningMember;

/**
 * 新增一个会员
 * @param newMember ：会员对象
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.addMember = function (newMember, callback) {
    diningMember.createOne(newMember, callback);
};

/**
 * 删除指定会员
 * @param query ：删除的过滤条件
 * @param callback  ：   回调函数 function（err,jellybeen ,snickers)
 */
exports.remove = function (query, callback) {
    diningMember.removeOne(query, callback);
};

/**
 * 根据query查询会员
 * @param query    ：   查询条件
 * @param opt      ：   参数
 * @param callback ：回调函数 function（err,doc)
 *
 membNo       : {type:String},                  // 会员卡号      数据唯一
 password     : {type:String},                  // 密码          最少6个字符
 state        : {type:Number},                  // 状态          正常：0 挂失：1 注销：2
 membLevelId  : {type: schema.Types.ObjectId, ref: 'membLevel'},                  // 会员等级     关联等级表
 name         : {type:String},                  // 姓名          不超过10个字符
 tel          : {type:String},                  // 手机号码
 prepayments  : {type:Number},                  // 预付款金额     验证数据类型为number
 points       : {type:Number},                  // 积分          验证数据类型为number
 datetime     : {type:Date},                    // 创建时间
 remark       : {type:String}                   // 备注
 */
exports.getMemberByQuery = function (query, opt, callback) {
    var displayField = 'membNo state membLevelId name tel prepayments points datetime remark giveMoney';
    var db = diningMember.find(query)        //查询条件
        .select(displayField)               //显示的字段
        .sort({membNo: 1});                 //排序字段及方式
        if(opt){
            if(opt.skip && opt.limit){
                db.skip(opt.skip).limit(opt.limit);
            }
            if(opt.type == "membLevel"){
                db.populate('membLevelId','name discounts');
            }
        }
    db.exec(callback);           //返回结果
};

exports.getMemberCount = function (query, callback) {
    diningMember.count(query, callback);
};

/**
 * 修改会员信息
 * @param query    ：更新的过滤条件
 * @param update   ：更新的内容
 * @param opt      ：参数
 * @param callback ：回调函数 function（err,doc)
 */
exports.updateMember = function (query, update, callback) {
    diningMember.updateOne(query, update, callback);
};
/**
 * 事务使用
 * @param query
 * @param update
 * @param callback
 */
exports.update = function (query, update, callback) {
    diningMember.update(query, update, callback);
};
exports.queryOneData = function (query, callback) {
    diningMember.findOne(query, callback);
};