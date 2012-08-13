var EXPORTED_SYMBOLS = ["javascriptRecorderFactory"];
Components.utils.import("resource://firecrystal/util/lib.js");

var Cc = Components.classes; var Ci = Components.interfaces;

function javascriptRecorderFactory(fc) {
	this.allowed = [];
	this.getFilterForFile = function(okFile) {
		var denormalizedOkFile = fcDebuggerDenomralizeURL(okFile);
		var urlFilter = {
			globalObject: null,
			flags: Ci.jsdIFilter.FLAG_ENABLED | Ci.jsdIFilter.FLAG_PASS,
			urlPattern: denormalizedOkFile,
			startLine: 0,
			endLine: 0
		};
		return urlFilter;
	};
 
	this.allowFile = function(fileName) {
		this.allowed.push(fileName);
	};
	this.startListening = function() {
		this.jsd = Cc["@mozilla.org/js/jsd/debugger-service;1"].getService(Ci.jsdIDebuggerService);
		for each(var fileName in this.allowed) {
			var fileFilter = this.getFilterForFile(fileName);
			this.jsd.appendFilter(fileFilter);
		}
		var filterAll = { //The filter that doesn't allow anything to pass through
				globalObject: null,
				flags: Ci.jsdIFilter.FLAG_ENABLED,
				urlPattern: "*",
				startLine: 0,
				endLine: 0
			};
		this.jsd.appendFilter(filterAll);
		this.jsd.interruptHook = {
				onExecute: function(frame,type,val) {
					fc.jsLineRun(frame, type, val);
					return Components.interfaces.jsdIExecutionHook.RETURN_CONTINUE;
				}
			};
		if(this.jsd.pauseDepth==1)
			this.jsd.unPause();
		this.jsd.on();
	};
	this.stopListening = function() {
		this.jsd.off();
		this.jsd.clearFilters();
	};
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