
var mailer=require("mailer");
var path=require('path');
var fs=require("fs");

/**
 * 日志文件
 * @type {*}
 */
var logPath=path.join(__dirname,'../loger/');
var Log=require('tracer').dailyfile({root:logPath});
/**
 * 负责监视的对象
 * @type {*}
 */
var checkQQ=require('./checkQQonline');
var checkWW=require('./checkWWonline');
var checkRR=require('./checkRRonline');
/**
 * 监视用户列表
 * @type {*}
 */
var watchersQQ=JSON.parse(fs.readFileSync('conf/QQlist.json','utf8'));
var watchersWW=JSON.parse(fs.readFileSync('conf/WWlist.json','utf8'));
var watchersRR=JSON.parse(fs.readFileSync('conf/RRlist.json','utf8'));
/**
 * 在线状态,USERSTATE
 * @type {Object}
 */
var USERSTATE={
	 ON:"ON"
	,OFF:"OFF"
	,OTHER:"OTHER"
};
/**
 * setTimeout时间
 * @type {Number}
 */
var intervalTime=20;

function LogInfo(logstr){
    console.log(logstr);
    Log.info(logstr);
}

/**
 * 轮训状态，并比较状态，发送邮件
 * @param theUser
 * @param theUserType
 * @param theWatchList
 * @param theChecker
 */
function watchUser(theUser,theUserType,theWatchList,theChecker){

    var theUserInfo=theWatchList[theUser];

    theChecker.checkOnline(theUser,function(err,nowstate,extData){
        if(err){
            LogInfo(theUserType+":"+theUser+'->'+extData);
        }
        else{
            if(USERSTATE.ON == theUserInfo.state && USERSTATE.OFF == nowstate){
                theUserInfo.state=USERSTATE.OFF;
                sendMailWithoutCallback(theUserInfo.phone,theUser,nowstate,theUserType,extData);
            }else if(USERSTATE.OFF == theUserInfo.state && USERSTATE.ON == nowstate){
                theUserInfo.state=USERSTATE.ON;
                sendMailWithoutCallback(theUserInfo.phone,theUser,nowstate,theUserType,extData);
            }else if(USERSTATE.OTHER==nowstate){
                console.log(theUserType+":"+theUser+"-> nowstate wrong");
            }else{
                console.log(theUserType+":"+theUser+"-> state no change!");
            }

        }
        setTimeout(watchUser,intervalTime * 1000,theUser,theUserType,theWatchList,theChecker);
	});

}

function nowDate(){

	return Date().replace(/:|\+| /g,'').replace(/\(.*?\)/g,'').replace(/[a-z]+/ig,'').substr(0,12);
			
}


function sendMailWithoutCallback(PHONE,USER,ONOFF,USERTYPE,extData){

	sendMail(	PHONE+'@139.com'
				,USER + ONOFF
				,USERTYPE+':'+ USER + "_" + extData +"_"+nowDate()
				,function(err,result){
					if(err){
						LogInfo(USERTYPE+':'+ USER+" ->发送邮件失败!");
					}else{
						LogInfo(nowDate() + ' '+USERTYPE+':'+ USER + "_" + extData + "发送给【" +PHONE +"】" + ONOFF +"信息成功!" );
					}
                    console.log('Result:'+result);
				}
			);

}

function sendMail(JmailTo,Jsubject,Jbody,callback){
	mailer.send({
      host : "smtp.qq.com",              	// smtp server hostname
      port : "25",                     		// smtp server port
      //ssl: true,                        	// for SSL support - REQUIRES NODE v0.3.x OR HIGHER
      domain : "mail@qq.com",            // domain used by client to identify itself to server
      to : JmailTo,
      from : "836704544@qq.com",
      subject : Jsubject,
      body: Jbody,
      authentication : "login",        		// auth login is supported; anything else is no auth
      username : "836704544@qq.com",        // username
      password : "11111_11111"         		// password
    },
    function(err, result){
      callback(err,result);
    }
	);

}

/**
 *
 * @param utype 类型
 * @param uwatchers 监视列表
 * @param uchecker  实现监视的对象
 */
function forWatchers(utype,uwatchers,uchecker){
  for(user in uwatchers){//QQNUMBER用USERNAME更佳
      (function(dstUser){//记下目前该QQ的状态
            uchecker.checkOnline(dstUser,function(err,nowstate,extdata){//image->cbdata
                //主要是获取初始状态
                if(err){
                    LogInfo(utype+":"+dstUser + '->' + extdata );
                }else{
                    uwatchers[dstUser].state=nowstate;
                    watchUser(dstUser,utype,uwatchers,uchecker);
                    console.log('start watch '+utype+":"+dstUser+"(now "+nowstate+",cb:"+extdata+')');
                }
            });
      })(user);
  }
}

forWatchers("QQ",watchersQQ,checkQQ);
forWatchers("WW",watchersWW,checkWW);
forWatchers("RR",watchersRR,checkRR);


console.log("========ENJOY IT!! MASTER CHEM KING=============\n");
console.log("=====I'M WATCHING I WILL WORK VERY HARD=========\n");

