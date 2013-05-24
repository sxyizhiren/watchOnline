/***************************88
author:金其明
检查指定QQ在线状态

***********************************/
var Request=require('../libs/request.js');

//我草，劲爆，这个可以显隐身了，太bug了，草草草！！！！
//但是怎么只能查电脑客户端的在线状态了
var dstUrl='http://wpa.qq.com/pa?p=1:XXXXXXXXXX:43'

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
        if(tmpObj.Location && tmpObj.Location.indexOf('button_30.gif') > 0){
            callback(null,QQSTATE.OFF,'');
        }else if(tmpObj.Location && tmpObj.Location.indexOf('button_31.gif') > 0){
            callback(null,QQSTATE.ON,'');
        }else{
            callback(null,QQSTATE.OTHER,'');
        }

    });

};

////
//test();

function test(){
    keep_alive();
    exports.checkOnline(786647787,function(err,state,ext){
        console.log('err:'+err);
        console.log('state:'+state);
        console.log('ext:'+ext);

    });
}

function keep_alive(){
    setTimeout(keep_alive,1000);
}


