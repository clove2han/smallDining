/**
 * Created by kui on 14-9-24.
 */
//这个是暴露出去的接口，把其他代理require进来这里
exports.permission = require('./permission');
exports.role = require('./role');
exports.staff = require('./staff');
exports.table = require('./table');
exports.tableType = require('./tableType');
exports.queue = require('./queue');
exports.dishes = require('./dishes');
exports.dishesType = require('./dishesType');
exports.flavor = require('./flavor');
exports.diningMember = require('./diningMember');
exports.memberLevel = require('./memberLevel');
exports.consumerLog = require('./consumerLog');
exports.restOrders = require('./restOrders');
exports.statistics = require('./statistics');
exports.pointsRule = require('./pointsRule');
exports.transatcion = require('./transatcion');
exports.transaction = require('./transaction');
exports.dishesOrder = require('./dishesOrder');
exports.rechargeLog = require('./rechargeLog');
exports.supplyTime = require('./supplyTime');
/*exports.shop = require('./shop');
exports.shopType = require('./shopType');
exports.merchant = require('./merchant');*/
