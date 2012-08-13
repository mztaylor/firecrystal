var EXPORTED_SYMBOLS = ['CSSInspector'];

Components.utils.import("resource://firecrystal/util/lib.js");

const Cc = Components.classes;
const Ci = Components.interfaces;

function CSSInspector(fc) {
	this.init = function() {
		this.domUtils = Cc["@mozilla.org/inspector/dom-utils;1"].getService(Ci.inIDOMUtils);
	};
	
	this.inspect = function(element) { // Most of this is from Firebug's css.js file
		var rv = [];
		var inspectedRules = this.domUtils.getCSSStyleRules(element);
		
		if(inspectedRules!=null) {
			for(var i = 0; i<inspectedRules.Count(); ++i) {
				var rule = inspectedRules.GetElementAt(i).QueryInterface(Ci.nsIDOMCSSStyleRule);
				var href = rule.parentStyleSheet.href;
				
				if(href && isSystemURL(href)) // This removes user agent rules 
					continue;
				if(!href) // http://code.google.com/p/fbug/issues/detail?id=452
					href = element.ownerDocument.location.href;
				
				var line = this.domUtils.getRuleLine(rule);
				rv.push({href: rule.parentStyleSheet.href, selector: rule.selectorText, stylesheet: rule.parentStyleSheet});
			}
		}

		return rv;
	};
	
	this.init();
}