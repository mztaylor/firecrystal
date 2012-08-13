var EXPORTED_SYMBOLS = ['CSSFileList'];

Components.utils.import("resource://firecrystal/replay/cssFile.js");
Components.utils.import("resource://firecrystal/util/lib.js");

function CSSFileList(fc) {
	this.filenameToFile = new Dict();
	this.getSourceForTag = function(tag) {
		var rv = this.filenameToFile.get(tag);
		if(rv==null) {
			rv = new CSSFile(tag);
			this.filenameToFile.set(tag, rv);
		}
		return rv;
	};
	this.getFileNames = function() {
		return this.filenameToFile.getKeys();
	};
	this.getFiles = function() {
		return this.filenameToFile.getValues();
	};
	this.addFile = function(tag, file) {
		this.filenameToFile.set(tag, file);
	};
}