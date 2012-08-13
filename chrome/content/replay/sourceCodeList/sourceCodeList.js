var EXPORTED_SYMBOLS = ['sourceCodeListFactory'];
var Cc = Components.classes; var Ci = Components.interfaces;

function sourceCodeListFactory(codeView, jsFileList, wdw, model, fc) {
	Components.utils.import("resource://firecrystal/util/lib.js", this);
	Components.utils.import("resource://firecrystal/replay/javascriptFile.js", this);
	Components.utils.import("resource://firecrystal/replay/cssFile.js", this);
	
	this.initialize = function() {
		this.doc = wdw.document;
		this.fileSelectListeners = [];
		this.liToFilename = new this.Dict();
		
		var HTMLLink = this.doc.getElementById("html");
		HTMLLink.addEventListener("click", this.bind(this.onHTMLClicked, this), true);
		
		this.sampleJS = this.doc.getElementById("js_file");
		this.jsParent = this.sampleJS.parentNode;
		this.jsParent.removeChild(this.sampleJS);
		
		this.sampleCSS = this.doc.getElementById("css_file");
		this.cssParent = this.sampleCSS.parentNode;
		this.cssParent.removeChild(this.sampleCSS);
		
		this.fileName = this.doc.getElementById("fileName");
		
		this.addJavascriptFiles();
		this.addCSSFiles();
	};
	
	this.addFileSelectListener = function(listener) {
		this.fileSelectListeners.push(listener);
	};
	
	this.addJavascriptFiles = function() {
		var js_files = jsFileList.getFiles();
		var js_menu_title = this.doc.getElementById("js_menu_title");
		js_menu_title.innerHTML = "Javascript&nbsp;("+js_files.length+")";
		
		for each(var jsFile in js_files) {
			this.addJavascriptFile(jsFile);
		}
	};
	this.addJavascriptFile = function(jsFile) {
		var jsTemplateClone = this.sampleJS.cloneNode(true);
		var jsTemplateLink = jsTemplateClone;

		jsTemplateLink.textContent = jsFile.getShortName();
		jsTemplateLink.addEventListener("click", this.bind(this.onJSFileClicked, this, jsFile), true);
		this.jsParent.appendChild(jsTemplateClone);
		this.liToFilename.set(jsFile.fileName, jsTemplateClone);
	};
	
	this.addCSSFiles = function() {
		var externalStyles = model.doc.getElementsByTagName('link');
		var css_menu_title = this.doc.getElementById("css_menu_title");
		var numStyles = 0;
		for(var i = 0; i<externalStyles.length; i++) {
			var styleTag = externalStyles[i];
			if(styleTag.rel.toLowerCase() == 'stylesheet') {
				var cssFile = new this.CSSFile(styleTag);
				this.addCSSFile(cssFile, styleTag);
				numStyles++;
			}
		}
		css_menu_title.innerHTML = "CSS&nbsp;("+numStyles+")";
	};
	
	this.addCSSFile = function(cssFile, tag) {
		var cssTemplateClone = this.sampleCSS.cloneNode(true);
		var cssTemplateLink = cssTemplateClone;
		
		cssTemplateLink.textContent = cssFile.getShortName();
		cssTemplateLink.addEventListener("click", this.bind(this.onCSSFileClicked, this, cssFile, tag), true);
		this.cssParent.appendChild(cssTemplateClone);
		this.liToFilename.set(tag.href, cssTemplateLink);
	};
	
	this.onHTMLClicked = function() {
		codeView.htmlClicked();
		this.setFileName("HTML");
	};
	this.onJSFileClicked = function(evt, jsFile) {
		codeView.jsFileClicked(jsFile);
		this.setFileName(jsFile.getShortName());
	};
	this.onCSSFileClicked = function(evt, cssFile, tag) {
		codeView.cssFileClicked(tag);
		this.setFileName(cssFile.getShortName());
	};
	this.setFileName = function(title) {
		this.fileName.textContent = title;
	};
	this.clearHighlights = function() {
		var liList = this.doc.getElementsByTagName("li");
		for each(var li in this.liToFilename.getValues()) {
			li.className = "";
		}
	};
	
	this.highlightJavascriptFile = function(js_event, special_highlight) {
		if(js_event!=null) {
			var li = this.liToFilename.get(js_event.fileName);
			var className = special_highlight ? "hasChangedDOM" : "hasRun";
			var classText = ", " + className;

			if(li.className.search(classText)==-1) {
				li.className += classText;
			}
		}
	};
	this.highlightCSSRules = function(rules) {
		for each(var rule in rules) {
			var href = rule.href;
			var li = this.liToFilename.get(href);

			var className = "hasChangedDOM";
			var classText = ", " + className;

			if(li.className.search(classText)==-1) {
				li.className += classText;
			}
		}
	};
	this.clearCSSHighlights = function() {
		var liList = this.doc.getElementsByTagName("li");
		for each(var li in this.liToFilename.getValues()) {
			li.className = "";
		}
	};
	
	this.initialize();

	return this;
}