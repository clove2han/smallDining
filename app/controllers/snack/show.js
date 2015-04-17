/**
 * 2015/1/19
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var saveSocket = require(CONTROLLERS + '/common/saveSocket');

/**
 * 保存客显的socketId
 */
router.post('/saveMate', function (req, res) {
    saveSocket.saveShow(req.body, function (err, data) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, data);
        }
    });
});

module.exports = router;