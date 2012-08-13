var EXPORTED_SYMBOLS = ['recordModelFactory'];
Components.utils.import("resource://firecrystal/record/recordLog.js");
Components.utils.import("resource://firecrystal/util/lib.js");
Components.utils.import("resource://firecrystal/util/events.js");
var Cc = Components.classes; var Ci = Components.interfaces;

const EVENTS_IGNORED_ON_TIMELINE = ['mousemove','mouseover','mouseout','scroll'];

function recordModelFactory(fc, wdw) {
	Components.utils.import("resource://firecrystal/record/domChangeUtils.js", this);
	
	this.events = new logFactory(fc);
	this.wdw = wdw;
	this.doc = wdw.document;
	this.initialDOMClone = null; // This is a clone of the initial state of the DOM
	this.cloneDict = new Dict();
	this.referenceClone = referenceCloneFactory(this.doc, fc);
	
	this.getScriptList = function() {
		var rv = [wdw.document.baseURI+"*"];
		var scripts = this.doc.getElementsByTagName('script');
		for each(var scriptTag in scripts) {
			if(scriptTag.src!="") {
				rv.push(scriptTag.src);
			}
		}
		return rv;
	};
	
	this.takeSnapshot = function() {
		var doc = this.wdw.document;
		var documentElement = doc.documentElement;
		var onCloneFunc = function(clone, node) {
			this.cloneDict.set(node, clone);
		};
		this.initialDOMClone = this.cloneNode(documentElement, bind(onCloneFunc, this), fc);
		this.referenceClone.takeSnapshot();
		this.addEvent(new InitialDomStateEvent(this.initialDOMClone));
		this.initialDimensions = {width:wdw.innerWidth,height:wdw.innerHeight};
		this.innerDimensions = {width:wdw.innerWidth,height:wdw.innerHeight};
	};

	this.onDomChange = function(evt) {
		if(!this.shouldIgnoreDomChange(evt)) {
			var domChangeEvent = this.domEventFactory(evt, this, fc);
			this.addEvent(domChangeEvent);
			this.referenceClone.onDomChange(evt);
		}
	};
	this.onUserInput = function(evt) {
		var addedEvent = new UserInputEvent(evt);
		
		if(evt.type == "resize") {
			addedEvent.oldWidth = this.innerDimensions.width;
			addedEvent.oldHeight = this.innerDimensions.height;
			this.innerDimensions = {width:wdw.innerWidth,height:wdw.innerHeight};
			addedEvent.newWidth = this.innerDimensions.width;
			addedEvent.newHeight = this.innerDimensions.height;
		}
		
		if(EVENTS_IGNORED_ON_TIMELINE.indexOf(evt.type)>=0) {
			addedEvent.onTimeline = false;
		}
		else {
			addedEvent.onTimeline = true;
		}
		this.addEvent(addedEvent);
	};
	this.onJavascriptLineExecuted = function(frame, type, val) {
		var pc = frame.pc;			
		var ppLine = frame.script.pcToLine(pc, Ci.jsdIScript.PCMAP_PRETTYPRINT);
		this.addEvent(new JSRunEvent(frame,type,ppLine));
	};
	
	this.addEvent = function(toAdd) {
		toAdd.timestamp = (new Date()).getTime();
		this.events.addEvent(toAdd);
	};
	
	this.shouldIgnoreDomChange = function(evt) {
		if(evt.target.id == '_firebugInWebPage')
			return true;
		else if(evt.target.id == '_firebugConsole')
			return true;
		return false;
	};

	return this;
}

function referenceCloneFactory(doc, fc) {
	Components.utils.import("resource://firecrystal/record/domChangeUtils.js", this);
	
	this.currentClone = null;
	this.cloneToNode = new Dict();
	this.nodeToClone = new Dict();
	
	this.takeSnapshot = function() {
		var documentElement = doc.documentElement;
		this.clone(documentElement);
	};
	
	this.clone = function(n) {
		var onCloneFunc = function(clone, node) {
			this.cloneToNode.set(clone, node);
			this.nodeToClone.set(node, clone);
		};
		this.currentClone = this.cloneNode(n, bind(onCloneFunc, this), fc);
	};
	
	this.onDomChange = function(evt) {
		if(evt.type=="DOMAttrModified") {
			var target = evt.target;
			var cloneTarget = this.getCloneOf(target);
			var attrName = evt.attrName;
			var nValue = evt.newValue;

			cloneTarget.setAttribute(attrName, nValue);
		}
		else if(evt.type=="DOMNodeInserted") {
			var target = evt.target;	
			if(!this.nodeToClone.hasKey(target)) {
				this.clone(target);
			}
			var cloneTarget = this.getCloneOf(target);
			var parent = evt.relatedNode;
			var cloneParent = this.getCloneOf(parent);
			var insertedBefore = target.nextSibling;
			var cloneInsertedBefore = this.getCloneOf(insertedBefore);
			
			cloneParent.insertBefore(cloneTarget, cloneInsertedBefore);
		}
		else if(evt.type == "DOMNodeRemoved") {
			var target = evt.target;	
			var cloneTarget = this.getCloneOf(target);
			var parent = evt.relatedNode;
			var cloneParent = this.getCloneOf(parent);
			
			cloneParent.removeChild(cloneTarget);
		}
		else if(evt.type == "DOMCharacterDataModified") {
			var target = evt.target;	
			var targetParent = target.parentNode;
			var cloneTargetParent = this.getCloneOf(targetParent);
			cloneTargetParent.textContent = evt.newValue;
			var target = evt.target;	
			if(!this.nodeToClone.hasKey(target)) {
				this.clone(target);
				var cloneTarget = this.getCloneOf(target);
				cloneTargetParent.textContent = evt.newValue;
				cloneTargetParent.appendChild(cloneTarget);
			}
			else {
				var cloneTarget = this.getCloneOf(target);
				cloneTarget.textContent = target.textContent;
			}
		}
	};
	
	this.getCloneOf = function(ofObject) {
		return this.nodeToClone.get(ofObject);
	};
	
	this.getNextSibling = function(ofObject) {
		var clonedObject = this.getCloneOf(ofObject);
		return this.cloneToNode.get(clonedObject.nextSibling);
	};

	return this;
}