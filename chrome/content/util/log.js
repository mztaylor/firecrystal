var EXPORTED_SYMBOLS = ["logFactory"];
const LOWEST_IMPORTANCE = -1;
function logFactory(Firebug) {
	this.makeLog = function(func, minImportance) {
		return function() {
			//Log a series of messages to the Firebug console
			var args = arguments;
			var argsLength = args.length;
			//If there is a number as the last argument, assume that argument represents the importance
			var importance = 0;
			if(typeof(args[argsLength-1]) == "number" && argsLength>1) {
				importance = args[argsLength-1];
				argsLength--;
			}	//Log a message to the Javascript console

			if(importance >= minImportance) {
				for(var i = 0; i<argsLength; i++) {
					func(args[i]);
				}
			}
		};
	};
	this.L1 = function(msg) {
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage(msg);
	};
	this.L2 = function(msg) {
		Firebug.Console.log(msg);
	};
	
	this.LOG1 = this.makeLog(this.L1, LOWEST_IMPORTANCE);
	this.LOG2 = this.makeLog(this.L2,LOWEST_IMPORTANCE)
	this.LOG  = this.LOG2;
	return this;
}

