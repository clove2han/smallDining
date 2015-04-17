/**
 * Created by Administrator on 2014/10/12.
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    utils = require('utility'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

var staffSchema = new schema({
    account: {type: String},                                    //账号
    userName: {type: String},                                   //姓名
    password: {type: String},                                   //密码
    state: {type: Boolean, default: true},                      //状态
    loginDate: {type: Date},                                    //登录时间（用于交接班的统计当天登录期间的报表）
    role: {type: schema.Types.ObjectId, ref: 'role'},           //角色(1:表示迎宾,2:服务员,3:厨师,4:收银员,5:业务管理员 6.店长)
    isAlternate: {type: Boolean, default: true},                //是否已经交接           false
    cookTypeIds: [{type: schema.Types.ObjectId, ref: 'dishesType'}], //厨师对应的可做的菜品类型
    createDate: {type: Date, default: Date.now},                 //创建时间
    isDel: {type: Boolean, default: false},
    isUpload: {type: Boolean, default: false}                      //是否上传了
});

staffSchema.index({account:1},{unique:true});
staffSchema.index({role:1});
staffSchema.index({_id:1},{isAlternate:1},{isDel:1});
staffSchema.index({_id:1,isAlternate:1});

validate.add('_id', {
    callback: function(value, respond) {
        value = String(value).trim();
        // 这里有3个判断值，分别为：
        // __isCreate: 执行 cretaOne 时为真
        // __isUpdate: 执行 updateOne 时为真
        // __isRemove: 执行 removeOne 时为真
        if (this.__isRemove) {
            this.model('staff').findOne({
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
    msg: '职员不存在'
});

//添加帐号验证
validate.add('account', {
    required: true,
    msg: '账号不能为空'
});

validate.add('account', {
    type: 'string',
    msg: '账号必须为字符串格式'
});

validate.add('account', {
    callback: function(value, respond) {
        value = String(value).trim();
        // 这里有3个判断值，分别为：
        // __isCreate: 执行 cretaOne 时为真
        // __isUpdate: 执行 updateOne 时为真
        // __isRemove: 执行 removeOne 时为真
        if (this.__isCreate) {
            this.model('staff').findOne({
                account: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '账号已存在'
});

//添加姓名验证
validate.add('userName', {
    required: true,
    msg: '姓名不能为空'
});

validate.add('userName', {
    type: 'string',
    msg: '姓名必须为字符串格式'
});

//添加密码验证
validate.add('password', {
    required: true,
    msg: '密码不能为空'
});

validate.add('password', {
    type: 'string',
    msg: '密码必须为字符串格式'
});

//添加角色验证
validate.add('role', {
    required: true,
    msg: '角色不能为空'
});

validate.add('role', {
    callback: function (value, respond) {
        this.model('role').find({
            _id: value
        }, function (e, doc) {
            if(e) return respond(e);
            if(doc.length > 0){
                return respond(true)
            }else{
                return respond(false)
            }
        })
    },
    msg: '角色不存在'
});

filter.add('account', 'trim');
filter.add('userName', 'trim');
filter.add('password', function(value, respond) {
    if (value.trim()){
        value = utils.md5(value);
        respond(value);
    }
});
filter.add('role', 'trim');

mongooseValidateFilter.validateFilter(staffSchema, validate, filter);
mongoose.model('staff', staffSchema);