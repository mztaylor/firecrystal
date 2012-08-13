var EXPORTED_SYMBOLS = ['cssCodeviewFactory'];

function cssCodeviewFactory(cssFile, codeTemplate, fc) {
	this.htmlObject = codeTemplate.cloneNode(true);
	
	this.getHTMLObject = function() {
		return this.htmlObject;
	};
	this.processFile = function() {
		var sourceTableBody = this.htmlObject.getElementsByClassName("sourceTableBody")[0];
		var stSource = sourceTableBody.getElementsByClassName("stSource")[0];
		
		sourceTableBody.removeChild(stSource);
		
		var fileSource = cssFile.getSourceLines();
		var lineNo = 1;
		for each(var line in fileSource) {
			var sourceLine = stSource.cloneNode(true);
			sourceLine.className = lineNo % 2 == 1 ? "odd" : "even";
			var sourceLineCode = sourceLine.getElementsByClassName("stSourceCode")[0];
			var sourceLineCodePre = sourceLineCode.getElementsByClassName("stSourceCodePre")[0];

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

	this.highlightSelector = function(selector) {
		var sourceTableBody = this.htmlObject.getElementsByClassName("sourceTableBody")[0];
		var startEnd = cssFile.getLinesForSelector(selector);

		var start = startEnd.start;
		var end = startEnd.end;
		for(var lineNo = start; lineNo <= end; lineNo ++) {
			var sourceTableBodyLines = sourceTableBody.getElementsByTagName("tr");
			var line = sourceTableBodyLines[lineNo-1];

			var className = "hasChangedDOM";
			var classText = ", " + className;

			if(line.className.search(classText)==-1) {
				line.className += classText;
			}
		}
	};
	this.processFile();
	return this;
}