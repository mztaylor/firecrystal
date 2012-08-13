var EXPORTED_SYMBOLS = ['JSFileList'];

Components.utils.import("resource://firecrystal/replay/javascriptFile.js");
Components.utils.import("resource://firecrystal/util/lib.js");

function JSFileList(fc) {
	this.filenameToFile = new Dict();
	this.getSourceForFile = function(filename) {
		var rv = this.filenameToFile.get(filename);
		if(rv==null) {
			rv = new JSFile(filename, fc);
			this.filenameToFile.set(filename, rv);
		}
		return rv;
	};
	this.getFileNames = function() {
		return this.filenameToFile.getKeys();
	};
	this.getFiles = function() {
		return this.filenameToFile.getValues();
	};
}