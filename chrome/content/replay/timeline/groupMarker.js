var EXPORTED_SYMBOLS = ['groupMarkerFactory', 'attachMarkerToPercentage'];

Components.utils.import("resource://firecrystal/util/lib.js");
Components.utils.import("resource://firecrystal/util/events.js");


function groupMarkerFactory(group, timeline, fc) {
	this.group = group;
	this.timeline = timeline;
	this.htmlRepresentation = null;
	this.construct = function() {
		var rail = timeline.rail;
		this.rail = rail;
		var railLocation = getPosXY(rail);
		var railX = railLocation.x; this.railX = railX;
		var railY = railLocation.y; this.railY = railY;
				
		var railHeight = rail.clientHeight;

		this.htmlRepresentation = getHTMLObjectForGroup(group, timeline.doc, railHeight, fc);
		
		this.htmlRepresentation.style.position = "absolute";
		this.htmlRepresentation.style.top = railY+"px";
		
		var wdw = this.timeline.doc.defaultView;
		wdw.addEventListener("resize", bind(this.onWindowResize, this),false);
		
		this.percentage = 0.5;
	};
	this.attachMarkerToPercentage = function(percentage) {
		this.timeline.rail.appendChild(this.htmlRepresentation);
		this.percentage = percentage;
		this.onWindowResize();
	};
	this.onWindowResize = function(evt) {
		var rail = this.rail;
		var railLocation = getPosXY(rail);
		var railX = railLocation.x; this.railX = railX;
		var railY = railLocation.y; this.railY = railY;

		
		var handleWidth = this.timeline.getHandleWidth();
		var railX = this.railX;
		var markerWidth = this.htmlRepresentation.clientWidth;
		var railWidth = this.timeline.getRailWidth();
		var percentage = this.percentage;
		
		var leftOffset = railX + (handleWidth - markerWidth)/2.0 + percentage*(railWidth-handleWidth);
	
		this.htmlRepresentation.style.top = railY+"px";

		this.htmlRepresentation.style.left = leftOffset+"px";
	};
	
	this.construct();
}

function getDivRectangle(doc, className) {
	var retVal = doc.createElement("div");
	retVal.className = className;
	
	return retVal;
}

function getImage(doc, filename, height) {
	var retVal = getDivRectangle(doc, "", height);
	var imgTag = doc.createElement("img");
	imgTag.src = filename;
	retVal.appendChild(imgTag);
	retVal.style.zIndex = 300;
	return retVal;
}

function getHTMLObjectForGroup(group, doc, height, fc) {
	const DIV_MARKER_WIDTH = 5;
	
	if(group.type == DOM_EVENT_TYPE) {
		return getDivRectangle(doc, "domChange");
	}
	else if(group.type == INITIAL_DOM_EVENT_TYPE) {
		return getDivRectangle(doc, "initialDOM");
	}
	else if(group.type == UI_EVENT_TYPE) {
		var ui_event = getUIEvent(group);
		var event_type = ui_event.evt.type;

		if(event_type == "mousedown") {
			if(ui_event.evt.button == 0) 
				return getDivRectangle(doc, "input_left_mouse_down");
			else
				return getDivRectangle(doc, "input_right_mouse_down");
		} 
		else if(event_type == "mouseup") {
			if(ui_event.evt.button == 0) 
				return getDivRectangle(doc, "input_left_mouse_up");
			else
				return getDivRectangle(doc, "input_right_mouse_up");
		}
		else if(event_type == "keydown") {
			return getDivRectangle(doc, "input_key_down");
		}
		else if(event_type == "keyup") {
			return getDivRectangle(doc, "input_key_up");
		}
		else if(event_type == "scroll") {
			return getDivRectangle(doc, "input_scroll");
		}
		else if(event_type == "resize") {
			return getDivRectangle(doc, "input_resize");
		}
		else if(event_type == "mousemove") {
		}
		else if(event_type == "mouseover") {
		}
		else if(event_type == "mouseout") {
		}
		else {
			fc.log("NO TYPE FOR " + event_type);
		}
	}
	fc.log("THIS SHOULDNT HAPPEN - 274583826");
	return getDivRectangle(doc, "");
}

function getUIEvent(group) {
	for each(var event in group.getIterable()) {
		if(event.type == UI_EVENT_TYPE && event.onTimeline) {
			return event;
		}
	}
	return null;//this should never happen
}