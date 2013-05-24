var BufferHelper=require('bufferhelper');
var url=require('url');
var http=require('http');
var path=require('path');
var DiyStep=require('./diyStep.js');

var userAgent='Mozilla/5.0 (Windows NT 5.1; rv:19.0) Gecko/20100101 Firefox/19.0';

/***
 * http.post
 * @param dstUrl    目标地址
 * @param headers   请求头，含cookie
 * @param retObj    存放返回值的地方
 * @param retContentType    返回值的类型
 * @param cb        出错的回调函数
 * @param postData  提交的值，字符串形式
 */
function postRequest(dstUrl,headers,postData,retObj,retContentType,cb){
    var postOption=url.parse(dstUrl);
    postOption.method='POST';
    postOption.headers=headers;
    if(!postOption.headers){
        postOption.headers={};
    }
    postOption.headers['Connection']='Keep-Alive';
    postOption.headers['User-Agent']=userAgent;
    postOption.headers['Content-Length']=postData.length;//postdata经过url编码所以不存在中文占字节大于1的问题
    var thisPost=http.request(postOption,function(resin){//console.log('post reach=>'+postData);
        var bufferHelper = new BufferHelper();
        var retHeaders=resin['headers'];
        var retCookie=retHeaders['set-cookie'];
        retObj.Status=resin['statusCode'];
        retObj.ContentType=retHeaders['content-type'];
        retObj.Cookie=cookieParser(retCookie,dstUrl);

        if(301==retObj.Status || 302==retObj.Status){
            retObj.Location=retHeaders['location'];
        }

        resin.on('data',function(msg){
            //console.log('.');
            bufferHelper.concat(msg);
        });
        resin.on('end',function(){
            //console.log('##post end');
            var resultBuffer=bufferHelper.toBuffer();
            setContent(retObj,resultBuffer,retContentType);
            DiyStep.StepInc(retObj);
            cb();
        });
    }).on('error',function(err){
        DiyStep.StepInc(retObj);
        cb(err);
    });
    thisPost.write(postData);
    thisPost.end();
}

/***
 * http.get
 * @param dstUrl    目标地址
 * @param headers   请求头，含cookie
 * @param retObj    存放返回值的地方
 * @param retContentType    返回值的类型
 * @param cb        出错的回调函数
 */
function getRequest(dstUrl,headers,retObj,retContentType,cb){
    ///////////////////////
    var getOption=url.parse(dstUrl);
    getOption.headers=headers;
    if(!getOption.headers){
        getOption.headers={};
    }
    getOption.headers['Connection']='Keep-Alive';
    getOption.headers['User-Agent']=userAgent;
    //////////////////////
    var getHttp=http.get(getOption,function(res){
        var bufferHelper = new BufferHelper();
        //////////////////////
        var retHeaders=res['headers'];
        var retCookie=retHeaders['set-cookie'];
        retObj.Status=res['statusCode'];
        retObj.ContentType=retHeaders['content-type'];
        retObj.Cookie=cookieParser(retCookie,dstUrl);
        if(301==retObj.Status || 302==retObj.Status){
            retObj.Location=retHeaders['location'];
        }

        ///////////////////////
        res.on('data',function(msg){
            //console.log('##DATA');
            bufferHelper.concat(msg);
        });
        res.on('end',function(msg){
            //console.log('##END');
            var resultBuffer=bufferHelper.toBuffer();
            setContent(retObj,resultBuffer,retContentType);
            DiyStep.StepInc(retObj);
            cb();
        });

    }).on('error',function(err){
        DiyStep.StepInc(retObj);
        cb(err);
    });
}

function setContent(retObj,resultBuffer,retContentType){
    switch(retContentType){
        case 'txt':
            retObj.Content=resultBuffer.toString();
            break;
        case 'json':
            try{
                retObj.Content=JSON.parse(resultBuffer.toString());
                retObj.parseStatus=true;
            }catch(e){
                retObj.Content=resultBuffer.toString();
                retObj.parseStatus=false;
                retObj.err=e;
            }
            break;
        case 'buf':
            retObj.Content=resultBuffer;
            break;
        default:
            retObj.Content=resultBuffer.toString();
            break;
    }
}

function cookieParser(cookieArray,dsturl){
    if(!cookieArray || 0==cookieArray.length)return '';
    var len=cookieArray.length;
    //console.log('cookieArray');
    //console.log(cookieArray);
    var pcookstr='';
    var pcook={};
    for(var i=0;i<len;i++) {
        var p=cookieArray[i].split(';');
        for(var j=0;j< p.length;j++){
            if(p[j].toLowerCase().indexOf('path=')>=0){
                var kv=p[j].split('=');
                if(dsturl.toLowerCase().indexOf(kv[1].toLowerCase().trim())>=0){    //符合路径的cookie留下
                    var pair=p[0].split('=');
                    pcook[pair[0].trim()]=pair[1].trim();
                }
                break;
            }
        }
    }
    for(var k in pcook){
        pcookstr+=k+'='+pcook[k]+';';
    }
    //console.log('pcook');
    //console.log(pcookstr);
    return pcookstr;
}




exports.get=getRequest;
exports.post=postRequest;

