var EXPORTED_SYMBOLS = ['groupListFactory'];

function groupListFactory() {
	this.groups = [];
	this.addGroup = function(group) {
		this.groups.push(group);
	};
	this.getIterable = function() {
		return this.groups;
	};
	this.indexOf = function(obj) {
		var i = 0;
		for each(var group in this.getIterable()) {
			if(group == obj) {
				return i;
			}
			i++;
		}
		return -1;
	};
	return this;
}