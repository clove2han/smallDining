
/**
 * 酒楼式快餐
 */
var grogshopAndSnackCtrl = CONTROLLERS + "grogshopAndSnack/";
module.exports = function  (app) {
    app.use('/grogshopAndSnack', require(grogshopAndSnackCtrl+"cashier"));
    app.use('/grogshopAndSnackKitchen', require(grogshopAndSnackCtrl+"kitchen"));
    app.use('/grogshopAndSnackGoFood', require(grogshopAndSnackCtrl+"gofood"));
    app.use('/grogshopAndSnackTakeout', require(grogshopAndSnackCtrl+"takeout"));
};