/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-4-29
 * Time: 上午12:06
 * To change this template use File | Settings | File Templates.
 */
/////////引入基本库//////////////
var fs=require('fs');
var http=require('http');
var path=require('path');
var querystring=require('querystring');
var RSATool=require('./rasEncode.js');
var Request=require('./request.js');
var DiyStep=require('./diyStep.js');


var dftWaitTime = 1000;//1秒，用于轮训间隔，默认1秒
//////////////////////////////
var renrenUtil=function(){
    var nextCallback;       //设置回调函数
    var emptyFn=function(){};//空函数
    var encryptkey;     //rsa加密参数
    var captcha;        //是否需要验证码
    var icode;          //验证码
    var uname;          //账户信息
    var homepage;       //主页的html
    var token;          //页面的token
    var loginInfo;      //账户及登陆信息
    var otherAccounts;  //其他用户身份信息【switchAccount】
    var pageState;      //页面状态【switchAccount】
    var newAccount;     //切换到另一用户身份【switchAccount】

    /////////////////////////
    //for onkeyLogin
    var udfCallBack;    //onekeyLogin时设置的用户自定义回调函数
    var udfFn=function(){   //调用自定义函数的函数
        if(typeof udfCallBack =='function'){
            loginInfo.token=token;
            udfCallBack(loginInfo);
        }
    };
    var processStep;    //当前是onekeyLogin的哪个步骤
    var NextProcessMap;    //登陆的各个步骤顺序执行，在后面赋值


    /**
     * 用于实现序列化执行一系列函数
     */
    var serialFn=function(){
        NextProcessMap[processStep]();
    }
    /////////////////////////
    var nextCallback;   //分步调用登陆个步骤时外部设置的回调函数

    /**
     * 调用nextCallback
     */
    var toCallback=function(){  //调用回调函数的函数
        if(typeof nextCallback =='function'){
            nextCallback();
        }
    };

    /**
     * 设置账号密码和是否公共主页
     * @param account
     */
    this.setAccount=function(account){
        loginInfo={};
        loginInfo.email=account.email || '';
        loginInfo.passwd=account.passwd || '';
        loginInfo.Cookie=account.Cookie || '';
        loginInfo.isPage=('true'==account.isPage)?'true':'false';
    }


    /**
     * 检测cookie是否有效，有效就算登录了
     */
    var cookieLogin=function(){
        //console.log('stepCookieLogin');
        processStep='stepCookieLogin';
        uname={};
        DiyStep.StepByStep(
            function (){
                return uname;
            },
            [
                function(){
                    var url='http://notify.renren.com/wpi/getonlinecount.do';
                    DiyStep.StepInc(uname);
                    Request.get(url,{Cookie:loginInfo.Cookie},uname,'txt',emptyFn);
                },
                emptyFn,
                function(){
                    var loginOk=false;
                    try{
                        var tmpJson=JSON.parse(uname.Content.trim());
                        if(tmpJson.hostid>0){
                            console.log('Cookie LOGIN OK!');
                            loginOk=true;
                        }else{
                            console.log('Cookie LOGIN FAIL!');
                        }

                    }catch(e){
                        //console.log(uname.Content);
                        console.log('Cookie LOGIN FAIL!');
                    }
                    if(loginOk){
                        loginInfo.Content={homeUrl:'http://www.renren.com/home'};
                        processStep='stepLogin';//直接跳到登录之后的步骤去
                        //console.log(tmpJson);
                    }
                    DiyStep.SetFinish(uname);
                    toCallback();
                }
            ],
            dftWaitTime
        );

    };

    /**
     * 设置RSA加密的参数
     */
    var getEncryptKey=function(){
        encryptkey={};
        //console.log('stepEncryptKey');
        processStep='stepEncryptKey';
        Request.get('http://login.renren.com/ajax/getEncryptKey',null,encryptkey,'json',toCallback);

    }

    /**
     * 检测改账号是否需要验证码
     */
    var getCaptcha=function(){
        captcha={};
        //console.log('stepCaptcha');
        processStep='stepCaptcha';
        var postData=querystring.stringify({
            'email': loginInfo.email
        });
        var url='http://www.renren.com/ajax/ShowCaptcha';
        var headers={
            'Referer':'www.renren.com'
            ,'Accept-Language': 'zh-cn'
            ,'Content-Type':'application/x-www-form-urlencoded'
            ,'Host': 'www.renren.com'
            ,'Content-Length':postData.length
            ,'Connection': 'Keep-Alive'
            ,'Cache-Control': 'no-cache'
        };
        Request.post(url,headers,postData,captcha,'txt',toCallback);
    }

    /**
     * 取验证吗图片，以及读取用户输入的验证码
     */
    var getICode=function(){
        //console.log('stepICode');
        processStep='stepICode';
        icode={str:''};
        if(1==captcha.Content || 4==captcha.Content){
            DiyStep.StepByStep(
                function (){
                    return icode;
                },
                [
                    function(){
                        DiyStep.StepInc(icode);
                        Request.get('http://icode.renren.com/getcode.do?t=web_login&rnd='+Math.random(),null,icode,'buf',emptyFn);
                    },
                    function(){

                    },
                    function(){
                        DiyStep.StepInc(icode);
                        fs.writeFileSync('icode.png', icode.Content, 'binary');
                    },
                    function(){
                        DiyStep.StepInc(icode);
                        console.log('输入验证码，请看当前目录下的icode.png');
                        getInputIcode(icode,toCallback);
                    },
                    function(){
                        //nothing
                    }
                ],
                dftWaitTime
            );
        }else{
            toCallback();
        }

    }

    /**
     * 前期工作准备好后，提交登录信息
     */
    var login=function(){
        //console.log('stepLogin');
        processStep='stepLogin';
        if(!loginInfo)
            loginInfo={};
        var pass=loginInfo.passwd;
        if(encryptkey.Content && encryptkey.Content.isEncrypt){
            RSATool.setMaxDigits(encryptkey.Content.maxdigits*2);
            var key=new RSATool.RSAKeyPair(encryptkey.Content.e,"null",encryptkey.Content.n);
            pass=RSATool.encryptedString(key, encodeURIComponent(pass));
        }
        //console.log(pass);
        var postData=querystring.stringify({
            'email': loginInfo.email,
            'origURL': 'http://www.renren.com/home',
            'icode': icode.str,
            'domain': 'renren.com',
            'key_id': 1,
            'captcha_type': 'web_login',
            'password': pass,
            'rkey': encryptkey.Content.rkey
        });
        //console.log(postData);
        var url = 'http://www.renren.com/ajaxLogin/login?1=1&uniqueTimestamp='+Math.random();
        var headers={
            'Referer':'www.renren.com'
            ,'Accept-Language': 'zh-cn'
            ,'Content-Type':'application/x-www-form-urlencoded'
            ,'Host': 'www.renren.com'
            ,'Content-Length':postData.length
            ,'Connection': 'Keep-Alive'
            ,'Cache-Control': 'no-cache'
            ,'Cookie':icode.Cookie
        };

        Request.post(url,headers,postData,loginInfo,'json',toCallback);
    }

    /**
     * 留言home页面，便于提取token
     */
    var browserHomepage=function(){
        homepage={};
        //console.log('stepHomepage');
        processStep='stepHomepage';
        var url=loginInfo.Content.homeUrl;
        if(url)
            loginInfo.logined=true;//用于外部判断是否登录成功

        homepage.url=url;
        Request.get(url,{Cookie: loginInfo.Cookie},homepage,'txt',processRealHomepage);
    }

    /**
     * home页面可能多次jump，这里处理jump
     */
    var processRealHomepage=function(){
        //console.log('HOMEPAGE:');
        //console.log(homepage.Cookie);
        if(homepage.Cookie && (homepage.Cookie.length > 3)){
            loginInfo.Cookie=cookieMerge(loginInfo.Cookie,homepage.Cookie);
            //console.log('loginInfo:');
            //console.log(loginInfo.Cookie);
        }
        if(301 == homepage.Status || 302 == homepage.Status){
            var url=homepage.Location;
            //console.log('homepage location:'+url);
            homepage.url=url;
            Request.get(url,{Cookie: loginInfo.Cookie},homepage,'txt',processRealHomepage/*可能还要跳转*/);
        }else{
            //不会进这里的
            toCallback();
        }
    }

    /**
     * 获取id和name，公共主页的name和id一样，获取不到
     */
    var getUname=function(){
        //console.log('stepUname');
        processStep='stepUname';
        if(!loginInfo)
            loginInfo={};
        var url='http://notify.renren.com/wpi/getonlinecount.do';
        //console.log('getUname cookie:');
        //console.log(loginInfo.Cookie);
        Request.get(url,{Cookie:loginInfo.Cookie},uname,'json',toCallback);
    }

    /**
     * 从home的html中解析出token
     */
    var parseToken=function(){
        token={};
        //console.log('stepToken');
        processStep='stepToken';
        html=homepage.Content;
        var tokenREG=/\{get_check:'(.+)',get_check_x:'(.+)',env:\{/;
        var ret;
        if(ret=tokenREG.exec(html)){
            token.requestToken=ret[1];
            token._rtk=ret[2];
            //console.log('token:requestToken['+token.requestToken+'],_rtk['+token._rtk+']');
        }else{
            //console.log('get token error!');
            token.requestToken='';
            token._rtk='';
        }
        toCallback();
    }

    /**
     * 设置回调函数
     * @param callbackfn
     */
    var setNextCallback=function(callbackfn){
        nextCallback=callbackfn;
    }

    /**
     * 一键登录，使登录各个步骤依次执行
     * @param callbackfn
     */
    this.onekeyLogin=function(callbackfn){
        //console.log('onekeyLogin');
        setNextCallback(serialFn);
        udfCallBack=callbackfn;
        cookieLogin();
    }

    /**
     * 读取别的账号，用户切换普通账号和公共主页
     */
    var getOtherAccount=function(){
        otherAccounts={};
        //console.log('stepOtherAccounts');
        processStep='stepOtherAccounts';
        var url='http://www.renren.com/getOtherAccounts';
        Request.get(url,{Cookie:loginInfo.Cookie},otherAccounts,'json',toCallback);
    }

    /**
     * 读取账户的状态信息，切换账号时要检测它的值
     */
    var getOtherPageState=function(){
        pageState={};
        //console.log('stepPageState');
        processStep='stepPageState';
        var needSwitch = (otherAccounts.Content && (loginInfo.isPage != otherAccounts.Content.self_isPage)
            && otherAccounts.Content.otherAccounts && otherAccounts.Content.otherAccounts[0])?true:false;
        pageState.needSwitch=needSwitch;
        if(needSwitch){
            //console.log('Need to switch account!');
            var pids=otherAccounts.Content.otherAccounts[0].transId;
            var url='http://page.renren.com/api/pageState';

            var postData=querystring.stringify({
                '_rtk': token._rtk,
                'pids':pids,
                'requestToken':token.requestToken
            });
            var headers={
                'Referer':'www.renren.com'
                ,'Accept-Language': 'zh-cn'
                ,'Content-Type':'application/x-www-form-urlencoded'
                ,'Host': getHostBySubmit(url)
                ,'Content-Length':postData.length
                ,'Connection': 'Keep-Alive'
                ,'Cache-Control': 'no-cache'
                ,'Cookie':loginInfo.Cookie
            };

            Request.post(url,headers,postData,pageState,'json',toCallback);
        }else{
            //console.log('Need NOT to switch account!');
            toCallback();
        }
    }

    /**
     * (确认要切换后)执行切换普通用户和主页的身份
     */
    var switchNewAccount=function(){
        newAccount={};
        //console.log('stepNewAccount');
        processStep='stepNewAccount';

        if(pageState.needSwitch && pageState.Content && (pageState.Content.code == 0)){
            var destId=otherAccounts.Content.otherAccounts[0].id;
            var url='http://www.renren.com/switchAccount';

            var postData=querystring.stringify({
                '_rtk': token._rtk,
                'destId': destId ,
                'origUrl':homepage.url,
                'requestToken':token.requestToken
            });
            var headers={
                'Referer':'www.renren.com'
                ,'Accept-Language': 'zh-cn'
                ,'Content-Type':'application/x-www-form-urlencoded'
                ,'Host': getHostBySubmit(url)
                ,'Content-Length':postData.length
                ,'Connection': 'Keep-Alive'
                ,'Cache-Control': 'no-cache'
                ,'Cookie':loginInfo.Cookie
            };
            Request.post(url,headers,postData,newAccount,'json',toCallback);
        }else{
            toCallback();
        }
    }

    /**
     * 检测是否切换成功，成功后重新读取home页面
     */
    var checkNewAccount=function(){
        //console.log('stepCheckNewAccount');
        processStep='stepCheckNewAccount';
        if(newAccount.Content && newAccount.Content.isJump){
            loginInfo.Content.homeUrl=newAccount.Content.url;
            processStep='stepLogin';//跳到登录之后的步骤去
        }
        toCallback();
    }


    /**
     * 开始工作
     * @return {Boolean}
     */
    this.startListenWork=function(){
        if(loginInfo.logined){
            return true;
        }else{
            return false;
        }
    }

    /**
     * 需要顺序执行的函数列表
     * @type {Object}
     */
    NextProcessMap={    //登陆的各个步骤顺序执行,必须放在各函数后面赋值，不然都是undefined
        //只有登录时和上传图片可使用，其他不许再用，不然会互相影响
        stepCookieLogin:getEncryptKey
        ,stepEncryptKey:getCaptcha
        ,stepCaptcha:getICode
        ,stepICode:login
        ,stepLogin:browserHomepage
        ,stepHomepage:getUname
        ,stepUname:parseToken
        ,stepToken:getOtherAccount
        ,stepOtherAccounts:getOtherPageState
        ,stepPageState:switchNewAccount
        ,stepNewAccount:checkNewAccount
        ,stepCheckNewAccount:udfFn
    };

}

////////////////////////////////////


/**
 * 根据url得到host
 * @param submit
 * @return {*|String}
 */
function getHostBySubmit(submit){
    var option=require('url').parse(submit);
    return option.host;
}

///////////////////////////////

/**
 * 数组转成json
 * @param arr
 * @param spliter
 * @return {Object}
 */
function array2json(arr,spliter){
    var tmpMap={};
    for(var i=0;i<arr.length;i++){
        var data=arr[i].split(spliter);
        if(data.length > 1){
            tmpMap[data[0]]=data[1];
        }
    }
    return tmpMap;
}

/**
 * json转成text
 * @param jso
 * @param spliter
 * @return {String}
 */
function json2txt(jso,spliter){
    var txt='';
    for(var i in jso)
    {
        txt += i + '=' + jso[i] + spliter;
    }
    return txt;
}

/**
 * 两条cookie合并，cookieTxt1中与cookieTxt2相同的key会被cookieTxt2覆盖
 * @param cookieTxt1
 * @param cookieTxt2
 * @return {String}
 */
function cookieMerge(cookieTxt1,cookieTxt2){
    var cookie1Map=array2json(cookieTxt1.split(';'),'=');
    var cookie2Map=array2json(cookieTxt2.split(';'),'=');

    for(var i in cookie2Map)
    {
        cookie1Map[i]=cookie2Map[i];
    }

    return json2txt(cookie1Map,';');
}

/////////////////////////////////////
/**
 * 获取用户输入验证码
 * @param getter
 * @param callbackfn
 */
function getInputIcode(getter,callbackfn){
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', function (chunk) {
        process.stdout.write('data: ' + chunk);
        var codeLen=4;
        getter.str=chunk.substr(0,codeLen);
        DiyStep.StepInc(getter);
        process.stdin.pause();
        callbackfn();
    });

    process.stdin.on('end', function () {
        process.stdout.write('end');
        process.stdin.pause();
    });
}



exports.INST=renrenUtil;


