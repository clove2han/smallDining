/**
 * Created by Administrator on 2014/10/9.
 */

module.exports = function (app) {
    /**
     * 公共路由
     */
     require('./base')(app);

    /**
     * 酒楼模式
     */
    require('./grogshop')(app);

    /**
     * 快餐模式
     */
    require('./snack')(app);
    /**
     * 酒楼式快餐
     */
    require('./grogshopAndSnack')(app);
    /**
     * 酒楼式快餐
     */
    require('./socket')(app);
};