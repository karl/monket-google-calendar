window.DayHighlighter = function() {
	var me = this;
	
	me.highlightToday = function() {
		today = $("#" + me.config.dayIdPrefix + new Date().customFormat(me.config.dateFormat));
		me.highlightDay(today);
	};
	
	me.highlightDay = function(day) {
		$("#calendar .week td").removeClass("today");
		day = $(day);
		
		if (day.length > 0) {
			day.addClass("today");
		}
	};
	
};