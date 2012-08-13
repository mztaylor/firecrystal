var EXPORTED_SYMBOLS = ["DOM_EVENT_TYPE", "JS_EVENT_TYPE", "UI_EVENT_TYPE", "INITIAL_DOM_EVENT_TYPE", "getScriptObj", "getFrameObj", "DOMChangeEvent",
						"JSRunEvent","UserInputEvent", "InitialDomStateEvent"];

function normalizeURL(url) {
    // For some reason, JSD reports file URLs like "file:/" instead of "file:///", so they
    // don't match up with the URLs we get back from the DOM
    return url ? url.replace(/file:\/([^/])/, "file:///$1") : "";
}

function getScriptObj(script) {
	var sObj = {fileName: script.fileName, baseLineNumber: script.baseLineNumber, callCount: script.callCount, flags: script.flags, 
					functionName: script.functionName, functionObject:script.functionObject, functionSource:script.functionSource,
					lineExtent: script.lineExtent, maxExecutionTime: script.maxExecutionTime, maxOwnExecutionTime:script.maxOwnExecutionTime,
					maxRecurseDepth:script.maxRecurseDepth, minExecutionTime:script.minExecutionTime, minOwnExecutionTime: script.minOwnExecutionTime,
					tag: script.tag, totalExecutionTime:script.totalExecutionTime, totalOwnExecutionTime:script.totalOwnExecutionTime, 
					version: script.version, toString: function(){return "jsdIScript[fileName:\""+this.fileName+"\",functionName:\""+this.functionName+"\"]";}};
	return sObj;
}

function getFrameObj(frame) {
	var fObj = {script:getScriptObj(frame.script), callee: frame.callee, callingFrame:frame.callingFrame, executionContext: frame.executionContext,
		functionName:frame.functionName,isConstructing:frame.isConstructing,isDebugger:frame.isDebugger, isNative:frame.isNative, line:frame.line,
		pc:frame.pc, scope:frame.scope,thisValue:frame.thisValue,
		toString: function(){ return "jsdIFrame[script:"+this.script.toString()+",line:"+this.line+",pc:"+this.pc+"]"}};
	return fObj;
}

var DOM_EVENT_TYPE = "DOM";
var JS_EVENT_TYPE  = "JS" ;
var UI_EVENT_TYPE  = "UI" ;
var INITIAL_DOM_EVENT_TYPE = "INIT";

var DOMChangeEvent = function(func,event, nextArgs, prevArgs) {
	this.event = event;
	this.func=func;
	this.type = DOM_EVENT_TYPE;
	this.nextArgs = nextArgs;
	this.prevArgs = prevArgs;
	this.toString = function() {
		return(this.type);
	}
};
var JSRunEvent = function(frame,type,ppline) {
	this.type = JS_EVENT_TYPE;
	this.frame = frame;
	this.ppline = ppline;
	this.fileName = normalizeURL(frame.script.fileName);
	this.script = frame.script;
	this.functionSource = this.script.functionSource;
	this.tag = this.script.tag;
	this.toString = function() {
		return(this.type+"["+this.fileName+",ppline="+this.ppline+"]");
	}
};
var UserInputEvent = function(evt) {
	this.type = UI_EVENT_TYPE;
	this.evt = evt;
	this.toString = function() {
		return(this.type+"["+evt.toString()+"]");
	}
};
var InitialDomStateEvent = function(state) {
	this.type = INITIAL_DOM_EVENT_TYPE;
	this.state = state;
	this.toString = function() {
		return(this.type);
	};
};