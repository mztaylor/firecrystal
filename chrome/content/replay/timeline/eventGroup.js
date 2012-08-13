var EXPORTED_SYMBOLS = ['eventGroupFactory'];

function eventGroupFactory() {
	this.events = [];
	this.timestamp = 0;
	this.type = null; //The type will be set by an outsider
	this.activated = false; //"Activated" will be used by the timeline to keep track of whether it has executed a group's actions
	this.addEvent = function(event) {
		this.events.push(event);
		if(event.timestamp > this.timestamp) { // The group's timestamp will be the MAX of all the event timestamps
			this.timestamp = event.timestamp;
		}
	};
	this.getIterable = function() {
		return this.events;
	};
	this.isEmpty = function() {
		return this.events.length==0;
	};
	
	return this;
}