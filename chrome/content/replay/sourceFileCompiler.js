var EXPORTED_SYMBOLS = ['compileJSLines'];

Components.utils.import("resource://firecrystal/replay/sourceCodeList/jsFileList.js");
Components.utils.import("resource://firecrystal/replay/javascriptFile.js");
Components.utils.import("resource://firecrystal/util/events.js");

function compileJSLines(model, fc) {
	this.init = function() {
		this.iterableEvents = model.events.getIterable();
		this.fileList = new JSFileList(fc);
	};

	this.createSourceFiles = function() {
		for each(var event in this.iterableEvents) {
			if(event.type == JS_EVENT_TYPE) {
				var jsFile = this.fileList.getSourceForFile(event.fileName);
				jsFile.assimilateEvent(event);
			}
		}
	};
	
	this.init();
	this.createSourceFiles();
	return this.fileList;
}