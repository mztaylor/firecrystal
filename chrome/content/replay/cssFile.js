var EXPORTED_SYMBOLS = ['CSSFile'];

Components.utils.import("resource://firecrystal/util/lib.js");

function CSSFile(tag, fc) {
	this.tag = tag;
	this.href = tag.href == "" ? tag.baseURI : tag.href;
	this.shortName = this.href ? this.href.split("/").pop() : "";
	this.lineNos = new Dict();
	this.getShortName = function() {
		return this.shortName;
	};
	this.getLinesForSelector = function(selector) {
		return this.lineNos.get(selector);
	};
	this.getSourceLines = function() {
		var rules = tag.sheet.cssRules;
		var lines = [];
		var start,end;
		for(var i = 0; i<rules.length; i++) {
			var rule = rules[i];
			lines.push(rule.selectorText + " {");
			start = lines.length;
			if(!rule.style) continue; //TODO: Fix;
			for each(var property in rule.style.cssText.split(";")) {
				property = trimSpaces(property);
				if(property)
					lines.push("    "+property+";");
			}
			
			lines.push("}");
			end = lines.length;
			this.lineNos.set(rule.selectorText, {start: start, end: end});
			if(i+1<rules.length) {
				lines.push("");
			}
		}
		return lines;
	};
}
function trimSpaces(str) {
	while(str.length > 0 && str.indexOf(" ")==0)
		str = str.substring(1);
	while(str.length > 0 && str.lastIndexOf(" ")==str.length-1)
		str = str.substring(0, str.length-1);
	return str;
}