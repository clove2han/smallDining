/**
 * 酒楼模式
 */
var grogshopCtrl = CONTROLLERS + "grogshop/";
 module.exports = function  (app) {
 	//迎宾员路由
   /* app.use('/usher', require(grogshopCtrl+ 'usher'));*/
    //服务员端路由
    app.use('/waiter', require(grogshopCtrl+ 'waiter'));
    //服务员端路由
    app.use('/kitchen', require(grogshopCtrl+ 'kitchen'));
    /** ------排队路由 ------ */
    app.use('/queue', require(grogshopCtrl+ 'queue'));
    /** ------ 订单路由 ------ */
    app.use('/cashier', require(grogshopCtrl+ 'cashier'));
     /** ------ 外卖路由 ------ */
     app.use('/grogshopTakeout', require(grogshopCtrl+ 'takeout'));

 };