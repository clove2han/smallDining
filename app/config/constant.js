var constant = {
    //订单状态
    ORDER_STATE: {
        WAIT_PAY_BILL: 0      //待结账
        ,ALREADY_PAY_BILL: 1  //已买单
        ,CALL_UP: 2           //叫起
    }
    //订单类型
    ,ORDER_TYPE: {
        DINING: 1             //餐厅
        ,TAKEOUT: 2           //外卖
        ,GROUP: 3             //团购
        ,RESERVATION: 4       //预订
    }
    //模式
    ,PATTERN: {
        GROG_SHOP: 1           //酒楼模式
        ,GROG_SHOP_AND_SNACK: 2//酒楼快餐模式
        ,SNACK: 3              //快餐模式
    }
    //外卖订单状态
    ,TAKEOUT_STATE: {
        PLACE_ORDER: 1            //下单
        ,CONFIRMS: 2              //店家确认
        ,REMINDER: 3              //催单
        ,SEND_OUT: 4              //送出
        ,EXCEED_LIMIT: 5          //过期
        ,FINISH: 6                //完成
    }
    //支付方式
    ,PAYMENT_METHOD: {
        CASH_PAY: 1                //现金
        ,ALI_PAY: 2                //支付宝
        ,WeChat_PAY: 3             //微信支付
        ,Union_PAY: 4              //银联支付
        ,VOUCHER_PAY: 5            //优惠券支付
        ,MEMBER_PAY: 6             //会员卡支付
        ,SMALL_PAY: 7              //小猫支付
        ,FREE_PAY: 8               //免单
        ,FEAST: 9                  //美餐
    }
    //退菜方式
    ,REFUND_METHOD: {
        NOT_PAY: 0                //未支付 订单未支付时，退菜不做记录
    }
    //订单菜品的状态
    ,DISHES_STATE: {
        TODO: 0                     //待做
        ,COOKING: 1                 //正在做菜
        ,REMINDER: 2                //催菜
        ,HAVE_DONE: 3               //已做完
        ,HAVE_SERVING: 4            //已上菜
        ,REFUND_FULL: 5             //已退完所有数量
    }
    //台位的状态
    ,TABLE_STATE: {
        LEISURE: 1                  //空闲
        ,RESERVATION: 2             //已预定
        ,OPEN_TAB: 3                //已开台
        ,IN_ORDER: 4                //点菜中
        ,HAVE_ORDER: 5              //已点菜
        ,SERVING: 6                 //正在上菜
        ,WAIT_CHECK: 7              //待结账
        ,HAVE_CHECK: 8              //已结账
    }
};

exports.constant = constant;