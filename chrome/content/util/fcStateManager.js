var EXPORTED_SYMBOLS = ["stateFactory"];

function stateFactory(fc) { // Keeps track of all the states FireCrystal might be in
	this.IDLE = 1;
	this.RECORDING = 2;
	this.WAITING_TO_RECORD_AFTER_RELOAD = 3;
	
	this.current = this.IDLE;
	
	return this;
}