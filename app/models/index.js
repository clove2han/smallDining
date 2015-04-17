var mongoose = require('mongoose'),
    config = require(BASEDIR + '/app/config/config.json');

mongoose.connect(config.db, function (err) {
	if(err){
		console.error('连接错误:', config.db, err.message);
		process.exit(1);
	}
});

require('./dishes');
require('./dishesType');
require('./flavor');
require('./table');
require('./tableType');
require('./queue');
require('./permission');
require('./role');
require('./staff');
require('./dishesOrder');
require('./restOrders');
require('./diningMember');
require('./memberLevel');
require('./pointsRule');
require('./consumerLog');
require('./cancelMemberLog');
require('./transatcion');
require('./transaction');
require('./merchant');
require('./shop');
require('./shopType');
require('./rechargeLog');
require('./supplyTime');
require('./giveRule');
require('./alternateLog');
require('./exceptionLog');

exports.dishesType = mongoose.model('dishesType');
exports.dishes = mongoose.model('dishes');
exports.flavor = mongoose.model('flavor');
exports.dishesOrder = mongoose.model('dishesOrder');
exports.restOrders = mongoose.model('restOrders');
exports.consumerLog = mongoose.model('consumerLog');
exports.cancelMemberLog = mongoose.model('cancelMemberLog');
exports.table = mongoose.model('table');
exports.tableType = mongoose.model('tableType');
exports.permission = mongoose.model('permission');
exports.role = mongoose.model('role');
exports.staff = mongoose.model('staff');
exports.queue = mongoose.model('queue');
exports.diningMember = mongoose.model('diningMember');
exports.memberLevel = mongoose.model('memberLevel');
exports.pointsRule = mongoose.model('pointsRule');
exports.transatcion = mongoose.model('transatcion');
exports.transaction = mongoose.model('transaction');
exports.merchant = mongoose.model('merchant');
exports.shop = mongoose.model('shop');
exports.shopType = mongoose.model('shopType');
exports.rechargeLog = mongoose.model('rechargeLog');
exports.supplyTime = mongoose.model('supplyTime');
exports.giveRule = mongoose.model('giveRule');
exports.alternateLog = mongoose.model('alternateLog');
exports.exceptionLog = mongoose.model('exceptionLog');