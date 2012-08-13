var EXPORTED_SYMBOLS = ['JSFile'];

Components.utils.import("resource://firecrystal/replay/javascriptSource.js");

function JSFile(fileName, fc) {
	this.fileName = fileName;
	this.shortName = this.fileName ? this.fileName.split("/").pop() : "";
	this.getShortName = function() {
		return this.shortName;
	};
	this.source = new JSSource(fc);
	this.assimilateEvent = function(event) {
		return this.source.assimilateEvent(event);
	};
	this.getSourceLines = function() {
		return this.source.getSourceLines();
	};
}