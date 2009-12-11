window.EventCreator = function(eventLoader, colourMap) {
	var me = this;
	me.eventLoader = eventLoader;
	me.colourMap = colourMap;
	
	me.create = function(event) {
		// Build the DOM object for the event
		var eventDOM = $("#templates .event").clone();

		$(".text", eventDOM).text(event.summary);
		if (event.length > 1) {
			eventDOM.addClass("multi-day");
		}
		if (event.isStart) {
			eventDOM.addClass('start');
		}
		if (event.isEnd) {
			eventDOM.addClass('end');
		}
		
		eventDOM.width((event.weekLength * 14.2857) + "%");			

		var color = me.eventLoader.calendars[event.calNumber - 1].getColor().getValue();
		$('.inner', eventDOM).css('background-color', me.colourMap[color]);

		if (event.summary.endsWith('?')) {
			eventDOM.addClass('tentative');
		}

		return eventDOM;
	};
	
};