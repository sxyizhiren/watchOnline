/***************************88
author:金其明
检查指定人人好友在线状态

***********************************/

var Request=require('../libs/request.js');
var RenRen=require('../libs/renrenLogin.js');

var parseFailTimes =0;
var maxFailTimes = 10;

var QQSTATE={
	 ON:"ON"
	,OFF:"OFF"
	,OTHER:"OTHER"
};

var FRIEND_ONLINE_STATE={
	 8:'手机在线'
	 ,4:'人人桌面在线'
	 ,6:'人人桌面在线'
	 ,2:'网页在线'
	 ,0:'不在线'
};

var ACCOUNTINFO={
	 'email':'hahalihongbo@126.com'
	,'passwd':'lhb123456'
	,'state':QQSTATE.OFF					//初始为不在线
    ,'isPage': 'false'
};

/**************************
被外部调用的接口
检查指定好友的在线状态
返回在线关状态或error给callback
***************************/
exports.checkOnline=function(rrID,callback){
	if(ACCOUNTINFO['state'] == QQSTATE.OFF)
	{
        console.log('RenRen not Logined!');
		loginRenRen(function(){
            exports.checkOnline(rrID,callback);
        });
		//登录成功后自动调用rrFriendOnline
	}
	else
	{
		rrFriendOnline(rrID,callback);
	}
};


function checkRRid(rrID,friList){
    for(var fri in friList)
    {
        if(friList[fri]['id'] + '' == rrID )
        {
            return friList[fri]['status'];
            break;
        }

    }
    return 0;
}

/**********************
利用已有的cookie信息检查指定好友的在线状态
返回在线状态及文字信息
异常则返回异常

********************/
function rrFriendOnline(rrID,callback)
{
	var url='http://notify.renren.com/wpi/getonlinefriends.do';

    var tmpObj={};
    Request.get(url,{Cookie:ACCOUNTINFO.Cookie},tmpObj,'json',function(){
        if(tmpObj.parseStatus && tmpObj.Content.hostid > 0){
            parseFailTimes = parseFailTimes ? (--parseFailTimes) : 0 ;
            var friList=tmpObj.Content['friends'];
            var onlineType=checkRRid(rrID,friList);
            if(onlineType){
                callback(null,QQSTATE.ON,FRIEND_ONLINE_STATE[onlineType]);
            }else{
                callback(null,QQSTATE.OFF,FRIEND_ONLINE_STATE[onlineType]);
            }
        }else{
            parseFailTimes = parseFailTimes ? (++parseFailTimes) : 1 ;
            if(parseFailTimes > maxFailTimes){
                process.exit(0);
            }
            callback(null,QQSTATE.OTHER,FRIEND_ONLINE_STATE[0]);
        }
    });
}

/********************
登录指定用户
登录成功则
1.保存t用于生成cookie
2.调用rrFriendOnline检查指定用户在线状况
3.更新登录用户的状态为已登录
登录失败以及任何异常都返回error

*********************/
function loginRenRen(callback)
{
    var renren=new RenRen.INST();
    renren.setAccount(ACCOUNTINFO);
    renren.onekeyLogin(function(logininfo){
        //console.log(logininfo);
        if(logininfo.logined){
            console.log('RenRen Login Succ!')
            ACCOUNTINFO['state'] = QQSTATE.ON;
            ACCOUNTINFO['Cookie'] = logininfo.Cookie;
            callback();
        }else{
            console.log('Login Fail!');
            ACCOUNTINFO['state'] = QQSTATE.OFF;
            callback();
        }

    });
}




//test();

function test(){
    keep_alive();
    exports.checkOnline(229591262,function(err,state,ext){
        console.log('err:'+err);
        console.log('state:'+state);
        console.log('ext:'+ext);
        exports.checkOnline(229591262,function(err,state,ext){
            console.log('err:'+err);
            console.log('state:'+state);
            console.log('ext:'+ext);
        });
    });
}

function keep_alive(){
    setTimeout(keep_alive,1000);
}

