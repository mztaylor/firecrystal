var EXPORTED_SYMBOLS = ['getEventsThatAffectObject'];
Components.utils.import("resource://firecrystal/util/events.js");
Components.utils.import("resource://firecrystal/util/lib.js");

function getEventsThatAffectObject(replayWindow, target, iterableGroups, replayManager, fc) {
	replayManager.onFirst();
	var rv = [];
	var lastComputedStyle, currentComputedStyle;
	lastComputedStyle = currentComputedStyle = getStyleCopy(replayWindow.getComputedStyle(target, ""), fc);

	//First, go through and find all of the events that you have to deactivate
	for each(var group in iterableGroups) {
		if(group.type == DOM_EVENT_TYPE) {			
			replayManager.goToGroup(group);		
			currentComputedStyle = getStyleCopy(replayWindow.getComputedStyle(target, ""), fc);			
			var changedProperties = getChangedProperties(lastComputedStyle, currentComputedStyle, fc);
			if(changedProperties.getKeys().length>0) {
				rv.push(group);
			}
			lastComputedStyle = currentComputedStyle;			
		}
	}

	/*
	var iterableEvents = group.getIterable();
	
	fc.log(group);
	for each(var event  in iterableEvents) {
	//	fc.log(event);
	}
	var currentStyle = this.outputFrame.getComputedStyle(target, "");
	fc.log(currentStyle);
	*/
	replayManager.onFirst();
	return rv;
}
function getChangedProperties(oldStyle, newStyle, fc) {
	var rv = new Dict();
	for each(var property in oldStyle.getKeys()) {		
		var oldValue = oldStyle.get(property);
		var newValue = newStyle.get(property);

		if(oldValue!=newValue) {
			rv.set(property, {'old': oldValue, 'new': newValue});
		}
	}

	return rv;
}

function getStyleCopy(style, fc) {
	var rv = new Dict();
	for(var i = 0; i < style.length; i++) {
		var property = style.item(i);
		
		var val = style.getPropertyValue(property);

		rv.set(property, val);
	}
	return rv;
}