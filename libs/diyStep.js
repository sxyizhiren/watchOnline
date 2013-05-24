/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-2-25
 * Time: 下午11:22
 * To change this template use File | Settings | File Templates.
 */

var STATE_FINISH=Infinity;
var STATE_INIT=0;
/**
 *
 * @param stepStatefn
 * @param stepList
 * @param stepTime
 */
function stepByStep(stepStatefn,stepList,stepTime){
    if(!stepList || stepList.length<1){
        return;
    }
    var stepState=stepStatefn();//可以实时获取可能已经改变引用地址的对象
    var state=(stepState.State || STATE_INIT);
    if(state<STATE_INIT){
        state=STATE_INIT;
    }

    if(state>=stepList.length){
        setFinish(stepState);
    }
    if(isFinished(stepState)){
       return;
    }else{
        stepList[state]();
    }

    setTimeout(stepByStep,stepTime,stepStatefn,stepList,stepTime);
}

function stepInc(stateobj){
    if(!stateobj.State)
        stateobj.State=STATE_INIT;

    stateobj.State++;
}

function setFinish(stateobj){
    return setState(stateobj,STATE_FINISH);
}

function isFinished(stateobj){
    return STATE_FINISH==stateobj.State;
}

function setState(stateobj,state){
    stateobj.State=state;
}

function setInit(stateobj){
    return setState(stateobj,STATE_INIT);
}

exports.StepByStep=stepByStep;
exports.StepInc=stepInc;
exports.IsFinished=isFinished;
exports.SetFinish=setFinish;
exports.SetInit=setInit;

