class MKT.DayHighlighter
	constructor: (config) ->
		@config = config
	
	highlightToday: ->
		@highlightDay $("#" + @config.dayIdPrefix + new Date().customFormat(@config.dateFormat))
	
	highlightDay: (day) ->
		$("#calendar .week td").removeClass "today"
		day = $(day)
		
		if day.length > 0
			day.addClass "today"

