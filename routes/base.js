var baseCtrl = CONTROLLERS + 'base/';
	/**
     * 公共路由
     */
module.exports = function  (app) {
	
    //权限路由
    app.use('/permission', require(baseCtrl+ 'permission'));
    //角色路由
    app.use('/role', require(baseCtrl+ 'role'));
    //职员路由
    app.use('/staff', require(baseCtrl+ 'staff'));
    //登录路由
    app.use('/login', require(baseCtrl+ 'login'));
    /** ------菜品路由 ------ */
    app.use('/dishes', require(baseCtrl+ 'dishes'));
    //配置接口
    app.use('/config', require(baseCtrl+ 'config'));
    /** ------ 菜品类型路由 ------ */
    app.use('/dishesType', require(baseCtrl+ 'dishesType'));
    /** ------ 口味路由 ------ */
    app.use('/flavor', require(baseCtrl+ 'flavor'));
    /** ------ 菜品订单路由 ------ */
    app.use('/dishesOrder', require(baseCtrl+ 'dishesOrder'));
    /** ------ 统计分析路由 ------ */
    app.use('/statistics', require(baseCtrl+ 'statistics'));
    /** ------台位路由 ------ */
    app.use('/table', require(baseCtrl+ 'table'));
    /** ------台位类型路由 ------ */
    app.use('/tableType', require(baseCtrl + 'tableType'));
    //报表接口
    app.use('/report', require(baseCtrl+ 'report'));
    /** ------会员路由 ------ */
    app.use('/diningMember', require(baseCtrl+ 'diningMember'));
    /** ------会员等级路由 ------ */
    app.use('/memberLevel', require(baseCtrl+ 'memberLevel'));
    /** ------积分规则路由 ------ */
    app.use('/pointsRule', require(baseCtrl+ 'pointsRule'));
    //供应时间段接口
    app.use('/supplyTime', require(baseCtrl+ 'supplyTime'));
    /** ------ 订单路由 ------ */
    app.use('/restOrders', require(baseCtrl+ 'restOrders'));
    //外卖订单接口
    app.use('/takeout', require(baseCtrl+ 'takeout'));
    //会员充值赠送规则
    app.use('/giveRule', require(baseCtrl+ 'giveRule'));
    //会员充值赠送规则
    app.use('/test', require(baseCtrl+ 'test'));
};