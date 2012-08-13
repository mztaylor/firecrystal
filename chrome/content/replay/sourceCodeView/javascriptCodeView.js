var EXPORTED_SYMBOLS = ['jsCodeviewFactory'];

function jsCodeviewFactory(jsFile, codeTemplate, fc) {
	this.htmlObject = codeTemplate.cloneNode(true);
	this.getHTMLObject = function() {
		return this.htmlObject;
	};
	this.processFile = function() {
				var sourceTableBody = this.htmlObject.getElementsByClassName("sourceTableBody")[0];
		var stSource = sourceTableBody.getElementsByClassName("stSource")[0];
		
		sourceTableBody.removeChild(stSource);
		
		var fileSource = jsFile.getSourceLines();
		var lineNo = 1;
		for each(var line in fileSource) {
			//var lineHandle = new model.LineHandle(scriptName, lineNo);
			var sourceLine = stSource.cloneNode(true);
			sourceLine.className = lineNo % 2 == 1 ? "odd" : "even";
			var sourceLineCode = sourceLine.getElementsByClassName("stSourceCode")[0];
			var sourceLineCodePre = sourceLineCode.getElementsByClassName("stSourceCodePre")[0];

			var generateSkipHandler = function(lHandle) {
				return function(evt) {
					thisView.setLineState(lHandle, evt.target.checked);
				};
			};

			sourceLineCodePre.textContent = line;

			sourceTableBody.appendChild(sourceLine);
			lineNo++;
		}
	};
	this.clearHighlight = function() {
		var sourceTableBody = this.htmlObject.getElementsByClassName("sourceTableBody")[0];
		for each(var sourceLine in sourceTableBody.getElementsByTagName("tr")) {
			sourceLine.className = sourceLine.className.replace(", hasRun", "");
			sourceLine.className = sourceLine.className.replace(", hasChangedDOM", "");
		}
	};
	var last2;
	var last;
	this.highlightEvent = function(event, special_highlight) {
		var sourceTableBody = this.htmlObject.getElementsByClassName("sourceTableBody")[0];

		var tag = event.tag;
		var sourceBaseLine = jsFile.source.functionLines.get(tag);
		var lineNo = sourceBaseLine + event.ppline-2;

		//Sorry this is confusing
		//Basically, if we insert some code into the middle of a file, we have to detect it here
		//and correct the offsets
		for each(var tag2 in jsFile.source.functionLines.getKeys()) {
			if(tag2!=tag) {
				var tagBase = jsFile.source.functionLines.get(tag2);
				if(tagBase > sourceBaseLine && lineNo > tagBase) {
					lineNo +=jsFile.source.numAdded.get(tag2);
				}
			}
		}

		var sourceTableBodyLines = sourceTableBody.getElementsByTagName("tr");
		var line = sourceTableBodyLines[lineNo-1];

		var className = special_highlight ? "hasChangedDOM" : "hasRun";
		var classText = ", " + className;

		if(line.className.search(classText)==-1) {
			line.className += classText;
		}
		last2 = last;
		last = event;

	};
	this.processFile();
	return this;
}