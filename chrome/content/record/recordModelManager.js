var EXPORTED_SYMBOLS = ['recordModelManagerFactory'];
Components.utils.import("resource://firecrystal/record/recordModel.js");
Components.utils.import("resource://firecrystal/util/lib.js");

function recordModelManagerFactory(fc) {
	this.models = new Dict();

	this.getModelForWindow = function(wdw) {
		var rv = this.models.get(wdw);
		if(rv == null) {
			rv = new recordModelFactory(fc, wdw);
			this.models.set(wdw, rv);
		}
		return rv;
	};

	this.onRecordWindow = function(wdw) {
		this.currentModel = this.getModelForWindow(wdw);
		for each(var scriptName in this.currentModel.getScriptList()) {
			this.tellJavascriptRecorderToListenTo(scriptName);
		}
		this.currentModel.takeSnapshot();
	};
	this.tellJavascriptRecorderToListenTo = function(fileName) { // This will tell the javascript debugger to start listening to a specified file
		fc.javascriptRecorder.allowFile(fileName);
	};
	this.onDomChange = function(evt) {
		this.currentModel.onDomChange(evt);
	};
	this.onUserInput = function(evt) {
		this.currentModel.onUserInput(evt);
	};
	this.onJavascriptLineExecuted = function(frame, type, val) {
		this.currentModel.onJavascriptLineExecuted(frame, type, val);
	};
}