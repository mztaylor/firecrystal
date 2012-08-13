var EXPORTED_SYMBOLS = ['activateEvent', 'activateGroup', 'deactivateGroup', 'groupActivatedSanityCheck', 'highlightGroupJavascript', 'clearHighlightedJavascript'];

Components.utils.import("resource://firecrystal/util/events.js");


//"DOM_EVENT_TYPE", "JS_EVENT_TYPE", "UI_EVENT_TYPE

function clearHighlightedJavascript(fc) {
	//fc.log("Clear highlighted");
	fc.replayManager.clearHighlightedFiles();
}

function highlightJavascriptLine(js_event, special_highlight, fc) {
	//The special highlight is reserved for the last highglighted item.
	fc.replayManager.highlightJSLine(js_event, special_highlight);
}

function highlightGroupJavascript(group, fc) {
	var lastEvent = null;
	var iterableEvents = group.getIterable();
	for(var i = 0; i<iterableEvents.length; i++) {
		var evt = iterableEvents[i];
		if(evt.type == JS_EVENT_TYPE) {
			highlightJavascriptLine(evt, false, fc);
			lastEvent = evt;
		}
	}
	highlightJavascriptLine(lastEvent, true, fc);
}

function activateGroup(group, model, outputWdw, fc) {
	group.activated = true;
	var iterableEvents = group.getIterable();
	for(var i = 0; i<iterableEvents.length; i++) {
		var evt = iterableEvents[i];
		activateEvent(evt, model, outputWdw, fc);
	}
}

function deactivateGroup(group, model, outputWdw, fc) {
	group.activated = false;
	var iterableEvents = group.getIterable();
	for(var i = iterableEvents.length-1; i>=0; i--) {
		var evt = iterableEvents[i];
		deactivateEvent(evt, model, outputWdw, fc);
	}
}

function activateEvent(evt, model, outputWdw, fc) {
	if(evt.type == DOM_EVENT_TYPE) {
		domFnApply(evt.func.next, evt.nextArgs, model);
	}
	else if(evt.type == UI_EVENT_TYPE) {
		if(evt.evt.type=="resize") {
			var iFrame = outputWdw.frameElement;
			iFrame.style.width = evt.newWidth +"px";
			iFrame.style.height = evt.newHeight+"px";
		}
	}
}

function deactivateEvent(evt, model, outputWdw, fc) {
	if(evt.type == DOM_EVENT_TYPE) {
		domFnApply(evt.func.prev, evt.prevArgs, model);
	}
	else if(evt.type == UI_EVENT_TYPE) {
		if(evt.evt.type=="resize") {
			var iFrame = outputWdw.frameElement;
			iFrame.style.width = evt.oldWidth +"px";
			iFrame.style.height = evt.oldHeight+"px";
		}
	}
}

function domFnApply(fn, args, model) {
	return fn.apply(null, [model.cloneDict.get(node) for each (node in args)]);
}

function groupActivatedSanityCheck(iterableGroups, currentIndex) {
	//Everything before our current group index should be activated and everything after should not
	for(var i = 0; i<iterableGroups.length; i++) {
		var activated = iterableGroups[i].activated;
		if(i <= currentIndex) {
			//Should be activated
			if(!activated) {
				return false;
			}
		}
		else {
			if(activated) {
				return false;
			}
		}
	}
	return true;
}