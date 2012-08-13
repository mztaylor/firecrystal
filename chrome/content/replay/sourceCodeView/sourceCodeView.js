var EXPORTED_SYMBOLS = ['codeViewFactory'];

Components.utils.import("resource://firecrystal/util/lib.js");
Components.utils.import("resource://firecrystal/replay/sourceCodeView/htmlCodeView.js");

function codeViewFactory(cssFileList, jsFileList, model, wdw, fc) {
	this.initialize = function() {
		this.doc = wdw.document;
		this.body = this.doc.body;
		this.sourceDiv = this.doc.getElementById("source");
		this.extractTemplates();
		this.jsFileToView = new Dict();		
		this.cssFileToView = new Dict();		
		
		var htmlUL = this.doc.createElement("UL");
		htmlUL.className = "dom_tree";
		htmlUL.id = "dom_tree";
		var initDOM = model.initialDOMClone;
		this.HTMLElementToLI = getDOMTree(this.doc, initDOM, htmlUL, this);
		this.htmlDOMTree = htmlUL;

		var evt = this.doc.createEvent("XULCommandEvent");
		evt.initCommandEvent('init_tree',
				true,
				true,
				wdw,
				0,
				false,
				false,
				false,
				false,
				null
			);

		this.setSource(this.htmlDOMTree);
		wdw.dispatchEvent(evt);
		this.createViews();
		this.clearSource();
	};
	this.htmlClicked = function() {
		this.clearSource();
		this.setSource(this.htmlDOMTree);
	};
	this.jsFileClicked = function(jsFile) {
		var jsView = this.jsFileToView.get(jsFile.fileName);
		
		this.clearSource();
		this.setSource(jsView.getHTMLObject());
	};
	this.cssFileClicked = function(tag) {
		var cssView = this.cssFileToView.get(tag);
		
		this.clearSource();
		this.setSource(cssView.getHTMLObject());
	};
	
	this.extractTemplates = function() {
		this.extractJavascriptTemplate();
		this.cssTemplate = this.jsTemplate;
	};
	
	this.extractJavascriptTemplate = function() {
		this.jsTemplate = this.doc.getElementById("fileSource");
		this.jsTemplate.parentNode.removeChild(this.jsTemplate);
	};
	
	this.createViews = function() {
		this.createJSViews();
		this.createCSSViews();
	};
	
	this.createJSViews = function() {
		Components.utils.import("resource://firecrystal/replay/sourceCodeView/javascriptCodeView.js", this);
		
		for each(var file in jsFileList.getFiles()) {
			var fileView = new this.jsCodeviewFactory(file, this.jsTemplate, fc);
			this.jsFileToView.set(file.fileName, fileView);
		}
	};
	
	this.createCSSViews = function() {
		Components.utils.import("resource://firecrystal/replay/sourceCodeView/cssView.js", this);
		
		for each(var file in cssFileList.getFiles()) {
			var fileView = new this.cssCodeviewFactory(file, this.cssTemplate, fc);
			this.cssFileToView.set(file.tag, fileView);
		}
	};
	
	this.clearSource = function() {
		while(this.sourceDiv.firstChild!=null) {
			this.sourceDiv.removeChild(this.sourceDiv.firstChild);
		}
	};
	this.setSource = function(obj) {
		this.sourceDiv.appendChild(obj);
	};
	
	this.clearHighlights = function() {
		for each(var file in jsFileList.getFiles()) {
			var fileView = this.jsFileToView.get(file.fileName);
			fileView.clearHighlight();
		}
	};
	
	this.highlightJavascriptLine = function(js_event, special_highlight) {
		if(js_event!=null) {
			var fileView = this.jsFileToView.get(js_event.fileName);
			fileView.highlightEvent(js_event, special_highlight);
		}
	};
	this.highlightCSSRules = function(rules) {
		for each(var rule in rules) {
			var href = rule.href;
			for each(var link in this.cssFileToView.getKeys()) {
				if(href == link.href) {
					var view = this.cssFileToView.get(link);
					view.highlightSelector(rule.selector);
					break;
				}
			}
		}
	};
	this.clearCSSHighlights = function() {
		for each(var view in this.cssFileToView.getValues()) {
			view.clearHighlight();
		}
	};
	this.highlightHTMLElement = function(element) {
		var li = this.HTMLElementToLI.get(element);
		if(li!=null) {
			if(li.className.indexOf("highlighted") < 0) {
				li.className += " highlighted";
			}
			var currLI = li;
			while(currLI!=null && currLI.tagName == "LI") {
				for each(var plus_minus in currLI.getElementsByClassName("plus_minus")) {
					if(plus_minus.src.indexOf("plus_") >= 0) {
						var aLink = plus_minus.parentNode;
						plus_minus.src = plus_minus.src.replace("plus_", "minus_");
						click(aLink, fc);
					}
				}
				currLI = currLI.parentNode.parentNode;
			}
		}
	};
	this.clearHTMLHighlights = function() {
		for each(var li in this.HTMLElementToLI.getValues()) {
			if(li) {
				li.className = li.className.replace("highlighted", "");
			}
			//Click the series of plusses to make the element visible
		}
	};
	this.elementClicked = function(event, element) {
	};
	this.elementHoveredOver = function(event, element) {
	};
	this.elementHoveredOut = function(event, element) {
	};

	this.initialize();

	return this;
}
function click(obj, fc) {
	var doc = obj.ownerDocument;
	var clickevent=doc.createEvent("MouseEvents");
	clickevent.initEvent("click", true, true);
	obj.dispatchEvent(clickevent);
}