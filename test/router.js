/**
 * 2014/12/16
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var should = require('should');
var app = require('../app');
var request = require('supertest');
var testContent = require('./testContent.json');

describe('router testing', function () {

    testContent.forEach(function (item) {
        testFun(item)
    });

    function testFun(item){
        it(item.remark, function (done) {
            request(app)
                .post(item.urlPath)
                .send(item.sendConten)
                //.expect('Content-Type', 'text/html; charset=utf-8')
                .expect(200)
                .end(function(err, res){
                    if (err) throw err;
                    should.exist(res.text);
                    done();
                });
        });
    }

    it('404 response', function (done) {
        request(app)
            .get('/non/')
            .expect(404)
            .end(function(err, res){
                if (err) throw err;
                //should.exists(res.text);
                done();
            });
    });
});