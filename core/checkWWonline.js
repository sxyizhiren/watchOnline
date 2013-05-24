/***************************88
author:金其明
检查指定旺旺在线状态

***********************************/
var Request=require('../libs/request.js');

var dstUrl='http://amos.alicdn.com/realonline.aw?v=2&uid=XXXXXXXXXX&site=cntaobao&s=1&charset=utf-8'

var QQSTATE={
    ON:"ON"
    ,OFF:"OFF"
    ,OTHER:"OTHER"
};

exports.checkOnline=function(userNum,callback){
    var url=dstUrl.replace('XXXXXXXXXX',userNum);
    var tmpObj={};
    Request.get(url,{},tmpObj,'txt',function(){
        //console.log(tmpObj);
        if(tmpObj.Location && tmpObj.Location.indexOf('77-18.gif') > 0){
            callback(null,QQSTATE.OFF,'');
        }else if(tmpObj.Location && tmpObj.Location.indexOf('77-19.gif') > 0){
            callback(null,QQSTATE.ON,'');
        }else{
            callback(null,QQSTATE.OTHER,'');
        }

    });

};

////////////
//test();

function test(){
    keep_alive();
    exports.checkOnline('sxjinqi',function(err,state,ext){
        console.log('err:'+err);
        console.log('state:'+state);
        console.log('ext:'+ext);

    });
}

function keep_alive(){
    setTimeout(keep_alive,1000);
}
