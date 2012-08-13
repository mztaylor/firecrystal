var EXPORTED_SYMBOLS = ['TimelineAnimator'];

Components.utils.import("resource://firecrystal/util/lib.js");
Components.utils.import("resource://firecrystal/util/events.js");

function TimelineAnimator(replayManager, replayDoc, fc) {
	const SELECTED_GROUP = 1;
	const CURRENT_GROUP = 2;
	this.init = function() {
		this.groupMarkers = replayManager.groupMarkers;
		this.markerToGroup = new Dict();
		for each(var group in this.groupMarkers.getKeys()) {
			var marker = this.groupMarkers.get(group);
			this.markerToGroup.set(marker, group);
		}
		this.htmlMarkers = [];
		
		this.calloutDiv = replayDoc.getElementById("callout_div");
		this.setupTransitionEngines();
		this.calloutDiv.style.visibility = "hidden";
		this.overCursor = false;
		replayManager.addLocationChangeListener(this);
		this.initializeCalloutFrame();
		this.addMouseoverListeners();
	};
	this.highlightGroups = function(groups) {
		for each(var group in this.groupMarkers.getKeys()) {
			var marker = this.groupMarkers.get(group);
			var toContinue = false;
			for each(var g2 in groups) {
				if(g2 == group) {
					toContinue = true;
					break;
				}
			}
			if(toContinue)
				continue;
			else {
				var htmlRep = marker.htmlRepresentation;
				if(htmlRep.className.indexOf("faded")<0)
					htmlRep.className += " faded";
			}
		}
		//fc.log(this.groupMarkers);
		//fc.log("HIGHLIGHT: ");
		//fc.log(groups);
	};
	this.clearHighlights = function() {
		for each(var group in this.groupMarkers.getKeys()) {
			var marker = this.groupMarkers.get(group);
			var htmlRep = marker.htmlRepresentation;
			
			htmlRep.className = htmlRep.className.replace(" faded", "");
		}
	};
	
	this.initializeCalloutFrame = function() {
		this.calloutHTMLGetter = new CalloutHTMLGetter(replayDoc, fc);
		var calloutIFrame = replayDoc.getElementById("callout_iframe");
		this.calloutIFrame = calloutIFrame;
		this.calloutDoc = calloutIFrame.contentDocument;
		var headID = this.calloutDoc.getElementsByTagName("head")[0];         
		var cssNode = this.calloutDoc.createElement('link');
		cssNode.type = 'text/css';
		cssNode.rel = 'stylesheet';
		cssNode.href = 'callout.css';
		headID.appendChild(cssNode);
	};
	this.clearCallout = function() {
		while(this.calloutDoc.body.firstChild!=null) {
			this.calloutDoc.body.removeChild(this.calloutDoc.body.firstChild);
		}
	};
	this.appendObjectToCallout = function(obj) {
		this.calloutDoc.body.appendChild(obj);
	}
	this.setupTransitionEngines = function() {
		var win = replayDoc.defaultView;
		
		var opacityGet = bind(function(div){return div.style.MozOpacity;}, this, this.calloutDiv);
		var opacitySet = bind(function(to, div){div.style.MozOpacity = to;}, this, this.calloutDiv);
		opacitySet(0);
		this.calloutOpacityTransitionEngine = new TransitionEngine(opacityGet, opacitySet, 12, 500, win, fc);
		this.calloutOpacityTransitionEngine.fadeIn = bind(function(div){
																this.onStop = null;
																div.style.visibility = "visible";
																this.set(0.85);
															}, 
								this.calloutOpacityTransitionEngine, this.calloutDiv);
		this.calloutOpacityTransitionEngine.fadeOut = bind(function(div){
																this.set(0.0);
																this.onStop = function() {
																	div.style.visibility = "hidden";
																	div.style.lastTop = div.style.top;
																	div.style.left = div.style.top = "0px";
																};
															}, 
								this.calloutOpacityTransitionEngine, this.calloutDiv);
		
		var calloutLeftGet = bind(function(div){return parseInt(div.style.left)}, this, this.calloutDiv);
		var calloutLeftSet = bind(function(to, div){div.style.lastLeft = div.style.left = to + "px";}, this, this.calloutDiv);
		this.calloutLeftTransitionEngine = new TransitionEngine(calloutLeftGet, calloutLeftSet, 14, 120, win, fc);
		this.calloutLeftTransitionEngine.setLeft = bind(function(to, div){
																div.style.left = div.style.lastLeft;
																this.set(to);
															}, 
								this.calloutLeftTransitionEngine, this.calloutDiv);
		
		var dongle = this.calloutDiv.getElementsByClassName("dongle")[0];
		dongle.style.left = "0px";
		var dongleLeftGet = bind(function(dongle){return parseInt(dongle.style.left);}, this, dongle);
		var dongleLeftSet = bind(function(to, dongle){dongle.style.left = to + "px";}, this, dongle);
		this.dongleLeftTransitionEngine = new TransitionEngine(dongleLeftGet, dongleLeftSet, 14, 120, win, fc);
	};
	
	this.addMouseoverListeners = function() {
		for each(var group in this.groupMarkers.getKeys()) {
			var marker = this.groupMarkers.get(group);
			
			var htmlRepresentation = marker.htmlRepresentation;
			this.htmlMarkers.push(htmlRepresentation);
			htmlRepresentation.addEventListener('mouseover', bind(this.onMouseOver, this, group), true);
			htmlRepresentation.addEventListener('mouseout', bind(this.onMouseOut, this, group), true);
		}
		var timelineHandle = replayManager.timeline.handle;
		timelineHandle.addEventListener('mouseover', bind(this.onMouseOver, this, SELECTED_GROUP), true);
		timelineHandle.addEventListener('mouseout', bind(this.onMouseOut, this, SELECTED_GROUP), true);
		
		this.calloutDiv.addEventListener('mouseover', bind(this.onMouseOver, this, CURRENT_GROUP), true);
		this.calloutDiv.addEventListener('mouseout', bind(this.onMouseOut, this, CURRENT_GROUP), true);
		this.calloutIFrame.addEventListener('mouseover', bind(this.onMouseOver, this, CURRENT_GROUP), true);
		this.calloutIFrame.addEventListener('mouseout', bind(this.onMouseOut, this, CURRENT_GROUP), true);
	};
	this.onMouseOver = function(evt, group) {
		if(group==SELECTED_GROUP) {
			group = this.getSelectedGroup();
			this.overCursor = true;
		}
		else if(group == CURRENT_GROUP) {
			if(this.currentGroup==null)
				group = this.getSelectedGroup();
			else
				group = this.currentGroup;
			this.overCursor = false;
		}
		else {
			this.overCursor = false;
		}
		this.currentGroup = group;
		var marker = this.groupMarkers.get(group);
		
		this.hoverCalloutOver(marker.htmlRepresentation);
		var calloutHTML = this.calloutHTMLGetter.getHTMLDescribingGroup(group);
		this.clearCallout();
		this.appendObjectToCallout(calloutHTML);
	};
	this.onMouseOut = function(evt, group) {
		this.overCursor = false;
		if(group==SELECTED_GROUP) {
			group = this.getSelectedGroup();
		}
		this.hideCallout();
	};
	this.getSelectedGroup = function() {
		return replayManager.currentGroup;
	};
	this.hoverCalloutOver = function(object) {
		this.showCallout();
		var desiredX = object.offsetLeft + object.offsetWidth/2;
		var desiredY = object.offsetTop;

		this.calloutDiv.style.top = (desiredY-this.calloutDiv.clientHeight)+"px";
		
		var leftPart = this.calloutDiv.getElementsByClassName("left")[0];
		var middlePart = this.calloutDiv.getElementsByClassName("center")[0];
		var rightPart = this.calloutDiv.getElementsByClassName("right")[0];
		var dongle = this.calloutDiv.getElementsByClassName("dongle")[0];
		
		var widthLeft = leftPart.clientWidth;
		var widthRight = rightPart.clientWidth;
		var widthDongle = dongle.clientWidth;
		var widthMiddle = middlePart.clientWidth;
		
		var clientWidth = replayDoc.defaultView.innerWidth;
		
		if(desiredX > clientWidth + widthDongle/2 - widthMiddle - widthRight) {
			var dongleLeft = ((desiredX - clientWidth) + widthMiddle + widthRight - widthDongle/2);
			var calloutLeft = (clientWidth - (widthLeft + widthRight + widthMiddle));
		}
		else {
			var dongleLeft = 0;
			var calloutLeft = (desiredX - (widthLeft + widthDongle/2));
		}
		this.calloutLeftTransitionEngine.setLeft(calloutLeft);
		this.dongleLeftTransitionEngine.set(dongleLeft);
	};
	this.hideCallout = function() {
		this.calloutOpacityTransitionEngine.fadeOut();
	};
	this.showCallout = function() {
		this.calloutOpacityTransitionEngine.fadeIn();
	};
	this.currentGroupChanged = function(group) {
		if(this.overCursor) {
			this.onMouseOver(null, SELECTED_GROUP);
		}
	};
	
	this.init();
}
function CalloutHTMLGetter(replayDoc, fc) {
	this.getHTMLDescribingGroup = function(group) {
		var rv = replayDoc.createElement("div");
		for each(var event in group.getIterable()) {
			var eventObject = this.getObjectForEvent(event);
			if(eventObject!=null) {
				rv.appendChild(eventObject);
			}
		}
		return rv;
	}
	this.getDiv = function(textContent,className) {
		var rv = replayDoc.createElement("div");
		if(className!=null)
			rv.className = className;
		rv.textContent = textContent;
		return rv;
	};
	this.getSpan = function(textContent,className) {
		var rv = replayDoc.createElement("span");
		if(className!=null)
			rv.className = className;
		rv.textContent = textContent;
		return rv;
	};
	this.getSpanHTML = function(htmlContent, className) {
		var rv = replayDoc.createElement("span");
		if(className!=null)
			rv.className = className;
		rv.innerHTML = htmlContent;
		return rv;
	};
	this.getBR = function() {
		return replayDoc.createElement("br");
	}
	this.getObjectForEvent = function(event) {
		
		if(event.type == JS_EVENT_TYPE)
			return null;
		else if(event.type == UI_EVENT_TYPE) {
			var rv =replayDoc.createElement("div");
			var ui_div = replayDoc.createElement("div");
			ui_div.className = "ui_event_title";
			rv.appendChild(ui_div);
			
			var type = event.evt.type;
			if(type == "mousemove")
				return null;
			else if(type == "mousedown") {
				ui_div.textContent = "Mouse down";
				var buttonName = (event.evt.button == 0 ? "Left" : "Right") + " button";
				rv.appendChild(this.getSpan(buttonName, "category_text"));
				rv.appendChild(this.getSpan(";  "));
				rv.appendChild(this.getSpan("X: ", "category_text"));
				rv.appendChild(this.getSpan(event.evt.clientX+", ", "value_text"));
				rv.appendChild(this.getSpan("Y: ", "category_text"));
				rv.appendChild(this.getSpan(event.evt.clientY, "value_text"));
				
				return rv;
			}
			else if(type == "mouseup") {
				ui_div.textContent = "Mouse up";
				var buttonName = (event.evt.button == 0 ? "Left" : "Right") + " button";
				rv.appendChild(this.getSpan(buttonName, "category_text"));
				rv.appendChild(this.getSpan(";  "));
				rv.appendChild(this.getSpan("X: ", "category_text"));
				rv.appendChild(this.getSpan(event.evt.clientX+", ", "value_text"));
				rv.appendChild(this.getSpan("Y: ", "category_text"));
				rv.appendChild(this.getSpan(event.evt.clientY, "value_text"));
				return rv;
			}
			else if(type == "mouseover")
				return null;
			else if(type == "mouseout") 
				return null;
			else if(type == "keydown") {
				ui_div.textContent = "Key down";
				var key = String.fromCharCode(event.evt.keyCode);
				rv.appendChild(this.getSpan("'", "value_text"));
				rv.appendChild(this.getSpan(key, "category_text"));
				rv.appendChild(this.getSpan("'", "value_text"));
				return rv;
			}
			else if(type == "keyup") {
				ui_div.textContent = "Key up";
				var key = String.fromCharCode(event.evt.keyCode);
				rv.appendChild(this.getSpan("'", "value_text"));
				rv.appendChild(this.getSpan(key, "category_text"));
				rv.appendChild(this.getSpan("'", "value_text"));
				return rv;
			}
			else if(type == "resize") {
				ui_div.textContent = "Window resized";
				var oldWidth = event.oldWidth;
				var oldHeight = event.oldHeight;
				var newWidth = event.newWidth;
				var newHeight = event.newHeight;
				if(oldWidth!=newWidth) {
					rv.appendChild(this.getSpan("Width: ", "category_text"));
					rv.appendChild(this.getSpan(oldWidth+"px to "+newWidth+"px", "value_text"));
				}
				else {
					rv.appendChild(this.getSpan("Width: ", "category_text"));
					rv.appendChild(this.getSpan(oldWidth+"px (not changed)", "value_text"));
				}
				rv.appendChild(this.getBR());
				
				if(oldHeight!=newHeight) {
					rv.appendChild(this.getSpan("Height: ", "category_text"));
					rv.appendChild(this.getSpan(oldHeight+"px to "+newHeight+"px", "value_text"));
				}
				else {
					rv.appendChild(this.getSpan("Height: ", "category_text"));
					rv.appendChild(this.getSpan(oldHeight+"px (not changed)", "value_text"));
				}
				return rv;
			}
			else
				fc.log(type);
			
		}
		else if(event.type == DOM_EVENT_TYPE) {
			var rv =replayDoc.createElement("div");
			var dom_div = replayDoc.createElement("div");
			dom_div.className = "dom_event_title";
			rv.appendChild(dom_div);
			dom_div.textContent = "DOM change";
			if(event.event.type == "DOMNodeRemoved") {
				rv.appendChild(this.getSpan("Node removed:", "category_text"));
				rv.appendChild(replayDoc.createElement("br"));
				rv.appendChild(event.func.sshot);
			}
			else if(event.event.type == "DOMNodeInserted") {
				rv.appendChild(this.getSpan("Node inserted:", "category_text"));
				rv.appendChild(replayDoc.createElement("br"));
				rv.appendChild(event.func.sshot);
			}
			else if(event.event.type == "DOMAttrModified") {
				rv.appendChild(this.getSpan("Attribute modified", "category_text"));
				rv.appendChild(replayDoc.createElement("br"));
				rv.appendChild(this.getSpanHTML("<b>"+event.func.property + "</b>:<br />" + "<i>From: </i> &quot;<code>"+event.func.prevValue+"</code>&quot;<br /><i>To:</i> &quot;<code>"+ event.func.newValue+"</code>&quot;"));
				rv.appendChild(replayDoc.createElement("br"));
				rv.appendChild(this.getSpan("Graphically:"));/*
				rv.appendChild(this.getSpanHTML("<br /><i>From</i>"));
				rv.appendChild(replayDoc.createElement("br"));
				rv.appendChild(event.func.newSShot);
				rv.appendChild(replayDoc.createElement("br"));
				rv.appendChild(this.getSpanHTML("<i>to</i>"));*/
				rv.appendChild(replayDoc.createElement("br"));
				rv.appendChild(event.func.newSShot);
				rv.appendChild
			}
			else if(event.event.type == "DOMCharacterDataModified") {
				rv.appendChild(this.getSpan("Characters data modified", "category_text"));
			}
			return rv;		
		}
		else if(event.type == INITIAL_DOM_EVENT_TYPE) {
			var rv =replayDoc.createElement("div");
			rv.className = "initial_dom_title";
			rv.textContent = "Started recording";
			return rv;
		}
	}
}