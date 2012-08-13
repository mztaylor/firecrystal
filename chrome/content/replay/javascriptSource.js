var EXPORTED_SYMBOLS = ['JSSource'];

Components.utils.import("resource://firecrystal/util/lib.js");


function JSSource(fc) {
	this.functionLines = new Dict();

	this.source = "";
	this.numAdded = new Dict();
	this.assimilateEvent = function(event) {
		var functionSource = event.functionSource;
		var changes = this.make_sure_file_has_function(this.source, functionSource);
		this.source = changes.newfile;
		
		if(changes.addedlines!=null) {
			this.numAdded.set(event.tag, changes.addedlines);
			for each(var tag in this.functionLines.getKeys()) {
				var tagLine = this.functionLines.get(tag);

				if(tagLine > changes.functlionline) {
					this.functionLines.set(tag, changes.addedlines + tagLine);
				}
			}
		}
		this.functionLines.set(event.tag, changes.functionline);
	};
	
	this.getSourceLines = function() {
		return this.source.split("\n");
	};
	
	this.make_sure_file_has_function = function (file, func) {
		if(fileContainsFunction(file, func)) {
			var unindented_file = remove_indentations(file);
			var unindented_func = remove_indentations(func);
			var matchIndex;
			if((matchIndex = unindented_file.indexOf(unindented_func))>=0) {
				var newlineCount = 1;
				var i = 0;
				for each (var c in unindented_file) {
					if(i>=matchIndex) {
						break;
					}
					if(c=="\n") {
						newlineCount++;
					}
					i++;
				}
				
				return {'newfile':file, 'functionline':newlineCount,'addedlines':null};
			}
			else {
				var funcIndex = 0;
				var funcC = func[funcIndex];
				var fileC;
				var newlineCount = 1;
				var foundMatch = false;
				var matchLine = 1;
				var justStarting=true;
				var segmentBegins = 0;
				var segmentEnds = 0;
				var oldNewLines = 0;

				for(var i = 0;; i++) {
					while(funcIndex<func.length && (funcC.charCodeAt(0)<=46)) { //Skip spaces, \n, etc.
						funcC = func[++funcIndex];
					}
					if(funcIndex >= func.length) {
						foundMatch = true;
						segmentEnds = i;
						break;
					}
					else if(i>=file.length) {
						break;
					}
					else {

						fileC = file[i];
						if(fileC == "\n") {
							newlineCount++;
							oldNewLines++;
							continue;
						}
						else if(fileC.charCodeAt(0)<=46) {//Skip spaces, \n, etc.
							continue;
						}

						if(justStarting) {
							matchLine = newlineCount;
							segmentBegins=i;
						}

						if(funcC == fileC) {
							justStarting=false;
							funcC = func[++funcIndex];
						}
						else {
							justStarting=true;
							oldNewLines = 0;
							funcC = func[(funcIndex = 0)];
						}
					}
				}
				if(foundMatch) {
					var newNewLines = 0;
					for each(var c in func) {
						if(c=="\n") {
							newNewLines++;
						}
					}
					if(newNewLines > oldNewLines) {
						var linesAdded = newNewLines - oldNewLines;

						var partOneFile = file.slice(0,segmentBegins);
						var partTwoFile = file.slice(segmentEnds);

						file = partOneFile+func+partTwoFile;
						return {'newfile':file, 'functionline':matchLine,'addedlines':linesAdded};
					}
					else {
						return {'newfile':file, 'functionline':matchLine,'addedlines':null};
					}
				}
				else {
					alert('PROBLEM');
				}
			}
		}
		else {
			var newlineCount = 1;
			for each(var c in file) {
				if(c=="\n") {
					newlineCount++;
				}
			}
			file = file+unIndent(func);
			return {'newfile':file, 'functionline':newlineCount,'addedlines':null};
		}
	};
}

function JSLine() {
};

function fileContainsFunction(file, func) {
	return flatten(file).indexOf(flatten(func))>=0;
}
function unIndent(str) {
	return str.replace(/[\n^]\s\s\s\s/g,"\n");
}
function remove_indentations(str) {
	var strSplit = str.split("\n");
	var a;
	for (a = 0; a < strSplit.length; a++){
		strSplit[a] = strSplit[a].replace(/^[\s\t]+/g,'');
	}
	return strSplit.join("\n");
}
function flatten(str) {
	return str.replace(/[\s\n]/g,"");
}