var EXPORTED_SYMBOLS = ['getIterableEvents', 'getIterableGroups', 'getMinimumTimestamp', 'getMaximumTimestamp',
						'groupEvents', 'getPercentagesForGroups', 'getGroupClosestToPercentage', 'canGoToGroup'];

Components.utils.import("resource://firecrystal/util/lib.js");
Components.utils.import("resource://firecrystal/util/events.js");
Components.utils.import("resource://firecrystal/replay/timeline/groupList.js");
Components.utils.import("resource://firecrystal/replay/timeline/eventGroup.js");

function getIterableEvents(model) {
	return model.events.getIterable();
}

function getIterableGroups(groupsList) {
	return groupsList.getIterable();
}

function hasMarker(event) { // Returns true if there is a marker for this kind of event in the timeline
//should be true for every type of event except for javascript run events
	return event.type == INITIAL_DOM_EVENT_TYPE || event.type == DOM_EVENT_TYPE || (event.type == UI_EVENT_TYPE && event.onTimeline);
}

function getMinimumTimestamp(iterableGroups) { // The lowest timestamp for any group
	return iterableGroups[0].timestamp;
}

function getMaximumTimestamp(iterableGroups) { // The highest timestamp for any group
	return iterableGroups[iterableGroups.length-1].timestamp;
}

function groupContainsNothingOnTimeline(group) {
	//Returns true if everything in the group is a javascript event
	var iterableGroupEvents = group.getIterable();
	for(var i = 0; i<iterableGroupEvents.length; i++) {
		var groupEvent = iterableGroupEvents[i];
		
		if(hasMarker(groupEvent)) {
			return false;
		}
	}
	return true;
}



function groupEvents(iterableEvents) {
	/*
	An event group is a set of events that "go together". For example, a series of DOM changes in a row with now
	javascript run in between is an event group.
	However, a user-input event with no javascript run before a DOM change should result in seperate event groups,
	although that should never really happen in our program
	*/
	var groups = groupListFactory();
	var currentGroup = new eventGroupFactory();
	for(var i = 0; i<iterableEvents.length; i++) {
		var event = iterableEvents[i];
		var nextEvent = null;
		if(i < iterableEvents.length-1)
			var nextEvent = iterableEvents[i+1];
		
		var nothingOnTimelineYet = groupContainsNothingOnTimeline(currentGroup); //It will be good to know this later on
		
		currentGroup.addEvent(event);
		
		if(event.type == INITIAL_DOM_EVENT_TYPE) { // Always make the initial state its own group
			currentGroup.type = INITIAL_DOM_EVENT_TYPE;
			groups.addGroup(currentGroup);
			currentGroup = new eventGroupFactory();
		}
		else if(event.type == DOM_EVENT_TYPE) {
			if(nothingOnTimelineYet) {
				currentGroup.type = DOM_EVENT_TYPE;
			}
			if(nextEvent!=null && nextEvent.type != DOM_EVENT_TYPE) {
				groups.addGroup(currentGroup);
				currentGroup = new eventGroupFactory();
			}
		}
		else if(event.type == UI_EVENT_TYPE && event.onTimeline) {
			if(nothingOnTimelineYet) {
				if(event.onTimeline)
					currentGroup.type = UI_EVENT_TYPE;
			}
			if(nextEvent!=null) {
				groups.addGroup(currentGroup);
				currentGroup = new eventGroupFactory();
			}
		}
		else if(event.type == JS_EVENT_TYPE) {
			//When javascript has run after some DOM or UI event, we want to start making this a seperate group
			//This is now the javascript that is going to responsible for the next event
			if(!groupContainsNothingOnTimeline(currentGroup)) {
				groups.addGroup(currentGroup);
				currentGroup = new eventGroupFactory();
			}
		}
	}
	//If the remainder isn't some trailing-off javascript, we will want to add one more group to the group list
	if(!currentGroup.isEmpty()) {
		if(!groupContainsNothingOnTimeline(currentGroup)) {
			groups.addGroup(currentGroup);
		}
	}
	
	return groups;
}

function getPercentagesForGroups(iterableGrouplist) {
	var normalLowestTimestamp = getMinimumTimestamp(iterableGrouplist);
	var normalHighestTimestamp = getMaximumTimestamp(iterableGrouplist);
	
	var overallTime = normalHighestTimestamp - normalLowestTimestamp;
	
	const MINIMUM_SEPERATION = 2 + overallTime/30;
	
	var currentTimestamp = normalLowestTimestamp;
	var lastTimestamp = currentTimestamp;
	var timestampDict = new Dict();
	
	var seperationMultiplier = 0;
	for each(var group in iterableGrouplist) {
		timestampDict.set(group, group.timestamp + seperationMultiplier * MINIMUM_SEPERATION);
		seperationMultiplier++;
	}
	
	var minimum_timestamp = timestampDict.get(iterableGrouplist[0]);
	var maximum_timestamp = timestampDict.get(iterableGrouplist[iterableGrouplist.length-1]);
	
	var timestamp_seperation = maximum_timestamp - minimum_timestamp;
	
	var percentageDict = new Dict();
	
	
	for each(var group in iterableGrouplist) {
		var group_timestamp = timestampDict.get(group);
		percentageDict.set(group, (group_timestamp - 1.0*minimum_timestamp)/timestamp_seperation);
	}

	return percentageDict;
}

function getGroupClosestToPercentage(iterableGrouplist, percentageDict, percentage) {
	var bestGroup = null;
	var bestDiff = 2.0;
	for each(var group in iterableGrouplist) {
		if(canGoToGroup(group)) {
			var group_percentage = percentageDict.get(group);
			var abs_diff = absDiff(percentage,group_percentage);
			if(abs_diff < bestDiff) {
				bestGroup = group;
				bestDiff = abs_diff;
			}
		}
	}
	return bestGroup;
}

function canGoToGroup(group) {
	return group.type == INITIAL_DOM_EVENT_TYPE || group.type == DOM_EVENT_TYPE;
}