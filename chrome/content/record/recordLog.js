var EXPORTED_SYMBOLS = ['logFactory'];

function logFactory(fc) {
	this.events = [];
	this.addEvent = function(event) {
		this.events.push(event);
	}
	this.getIterable = function() {
		return this.events;
	}
	return this;
}