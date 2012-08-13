var EXPORTED_SYMBOLS = ["userInputRecorderFactory"];
Components.utils.import("resource://firecrystal/util/lib.js");
const EVENT_TYPES = ['mousemove','mouseover','mouseout','scroll','textInput','keydown','keyup','mousedown','mouseup'];

function userInputRecorderFactory(fc) {
	this.boundUserInputHandler = bind(fc.userInput, fc);
	this.recordWindow = function(wdw) {
		var document = wdw.document;
		
		for each(var eventType in EVENT_TYPES) {
			document.addEventListener(eventType, this.boundUserInputHandler,true);
		}
		wdw.addEventListener("resize", this.boundUserInputHandler, true);
	};
	this.stopRecordingWindow = function(wdw) {
		var document = wdw.document;
		
		for each(var eventType in EVENT_TYPES) {
			document.removeEventListener(eventType, this.boundUserInputHandler,true);
		}
		wdw.removeEventListener("resize", this.boundUserInputHandler, true);
	};
}