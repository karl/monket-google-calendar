class window.EventCreator
	constructor: (eventLoader, colourMap, config) ->
		@eventLoader: eventLoader
		@colourMap: colourMap
		@config: config
		
	create: (event) ->
		# Build the DOM object for the event
		eventDOM: $("#templates .event").clone()
		eventDOM.data 'event', event

		$(".text", eventDOM).text event.summary
		
		eventDOM.width (event.weekLength * 14.2857) + "%"			

		eventDOM.addClass "multi-week" unless event.isStart && event.isEnd
		eventDOM.addClass 'start' if event.isStart
		eventDOM.addClass 'end' if event.isEnd
		eventDOM.addClass 'tentative' if event.summary.endsWith('?')
		eventDOM.addClass 'important' if event.summary.endsWith('!')
		eventDOM.addClass 'new' if event.isNew

		event.eventDOM: eventDOM

		@setColour event, event.calNumber
		@makeEditable event if event.editable

		return eventDOM

	makeEditable: (event) ->
		@makeDraggable event
		@makeResizable event
		event.eventDOM.click => @click event
	
	makeDraggable: (event) ->
		dragging: {}
		
		do_start_drag: (ev, ui) =>
			dragging.start: event.start
			dragging.end: event.end
			
			dragging.day: null
			$('#body').mousemove (e) =>
				dragging.day: $(e.target).parents('.day').add(e.target)
		
		do_drag: =>
			if dragging.day
				id: dragging.day.attr('id')
				dateString: id.substring(@config.dayIdPrefix.length)
				date: Date.parseYMD(dateString)
		
				oldStart: event.start
				oldEnd: event.end

				event.start: date
				event.end: date.addDays(event.length)

				if event.start - oldStart != 0 || event.end - oldEnd != 0
					@eventLoader.updateEvent(event, oldStart, oldEnd)							
			
		do_drag_stop: =>
			$('#body').unbind('mousemove')

			if (event.start - dragging.start != 0 || event.end - dragging.end != 0)
				event.eventDOM.addClass 'updating'

				event.save =>
					$.log('Moved event', arguments)
					event.eventDOM.removeClass 'updating'
				, =>
					$.log('Failed to move event :(', arguments)
					event.eventDOM.removeClass 'updating'
					event.eventDOM.addClass 'error'

		
		event.eventDOM.draggable {
			revert: true
			distance: 10
			helper: -> $('<div>')
			scroll: false
			cursor: 'move'
			handle: $('.text', event.eventDOM)
			start: do_start_drag
			drag: do_drag
			stop: do_drag_stop
		}

	makeResizable: (event) ->
		resizing: {}
		handles: []
		handles.push 'w' if event.isStart
		handles.push 'e' if event.isEnd

		do_resize_start: (e, ui) =>
			resizing.direction: if (e.pageX < (ui.originalPosition.left + (ui.originalSize.width / 2))) then 'start' else 'end'
			resizing.x: e.pageX
			resizing.y: e.pageY

			resizing.start: event.start
			resizing.end: event.end

			resizing.day: null
			$('#body').mousemove (e) =>
				resizing.day: $(e.target).parents('.day').add(e.target)

		do_resize: (e, ui) =>
			if resizing.day
				id: resizing.day.attr('id')
				dateString: id.substring(@config.dayIdPrefix.length)
				date: Date.parseYMD(dateString)

				oldStart: event.start
				oldEnd: event.end

				if resizing.direction == 'start'
					event.start: if date < resizing.end then date else resizing.end.addDays(-1)
				else if resizing.direction == 'end'
					event.end: if date > resizing.start then date.addDays(1) else resizing.start.addDays(1)

				event.length: Math.round((event.end - event.start) / (1000 * 60 * 60 * 24))

				if event.start - oldStart != 0 || event.end - oldEnd != 0
					@eventLoader.updateEvent(event, oldStart, oldEnd)							

		do_resize_stop: (e, ui) =>
			$('#body').unbind('mousemove')

			# event.eventDOM.remove()
			# @eventLoader.updateEvent(event)

			event.eventDOM.addClass 'updating'

			if event.start - resizing.start != 0 || event.end - resizing.end != 0
				event.save =>
					$.log('Resized event', arguments)
					event.eventDOM.removeClass 'updating'
				, =>
					$.log('Failed to resize event :(', arguments)
					event.eventDOM.removeClass 'updating'
					event.eventDOM.addClass 'error'

		if event.isStart || event.isEnd
			event.eventDOM.resizable {
				handles: handles.join(', ')
				ghost: true
				start: do_resize_start
				resize: do_resize
				stop: do_resize_stop
			}

	click: (event) ->
		return if event.eventDOM.hasClass('editing')

		editor: $('#templates .editor').clone()
		delButton: $('#templates .delete').clone()
		
		calendarPicker: @getCalendarPicker(event)

		startText: $('.text', event.eventDOM).text()
		startCalNumber: event.calNumber

		$('textarea', editor).text( if event.isNew then 'New event...' else startText)
		$('textarea', editor).height($('.text', event.eventDOM).height())
		$('textarea', editor).keyup( ->
			text: $('textarea', editor).val()
			
			# set width of layout event
			$("#layout-event").width((event.weekLength * 14.2857) + "%")
			height: $("#layout-event .text").text(text).outerHeight()
			
			$('textarea', editor).height(height)
			event.eventDOM.css('border', 'none')
		).keyup()
		
		parent: event.eventDOM.parent()
		top: event.eventDOM.css('top')
		
		event.eventDOM.css { 
			top: event.eventDOM.offset().top
			left: event.eventDOM.offset().left
		}
		event.eventDOM.appendTo $('body')
					
		$('.text', event.eventDOM).hide()
		
		$('.inner', event.eventDOM).append editor
		delButton.appendTo(event.eventDOM).hide().fadeIn()
		calendarPicker.appendTo(event.eventDOM).hide().fadeIn()
		
		$('textarea', editor).focus().select()
		event.eventDOM.addClass 'editing'
		event.eventDOM.removeClass 'error'
		
		deleteEvent: =>
			event.isDeleting: true
			removeEditor()
			
			event.eventDOM.addClass 'updating'
			event.eventDOM.addClass 'deleting'
			
			event.remove =>
				$.log 'Deleted event', arguments
				event.eventDOM.remove()
			, =>
				$.log 'Failed to delete event', arguments
				event.eventDOM.removeClass 'updating'
				event.eventDOM.removeClass 'deleting'
				event.eventDOM.addClass 'error'
				event.isDeleting: false
						
		removeEditor: (e) =>
			# Don't remove this editor if the user has clicked within it
			return if event == $(e?.target).parents('.event').data 'event'
			
			text: $.trim $('textarea', editor).val()
			if text == '' and !event.isDeleting
				deleteEvent()
				return
			
			event.eventDOM.appendTo(parent)
			event.eventDOM.css('top', top)
			
			$('.text', event.eventDOM).text(text).show()
			event.summary: text
			editor.remove()
			delButton.remove()
			calendarPicker.remove()
			event.eventDOM.removeClass('editing')

			@eventLoader.updateEvent(event)
							
			eventChanged: text != startText || event.calNumber != startCalNumber
			if eventChanged && !event.isDeleting
				event.eventDOM.addClass 'updating'

				event.save  =>
					$.log('Updated event', arguments)
					event.eventDOM.removeClass 'updating'
				, =>
					$.log('Failed update event :(', arguments)
					event.eventDOM.removeClass 'updating'
					event.eventDOM.addClass 'error'
				, startCalNumber					

			else if event.isDeleteing
				event.eventDOM.addClass 'updating'
		
			$('body').unbind('click', removeEditor)
			$("#body").unbind('mousewheel', removeEditor)

		$('textarea', editor).keyup (e) ->
			if e.keyCode == 13
				removeEditor()
			else if e.keyCode == 27
				# reset event
				$('textarea', editor).val(startText)
				event.calNumber: startCalNumber
				removeEditor()

		$('textarea', editor).keypress (e) ->
			e.preventDefault() if e.keyCode == 13

		setTimeout ->
			$(delButton).click (e) ->
				deleteEvent()
				e.stopPropagation()

			$('body').click removeEditor
			$('#body').mousewheel removeEditor
		, 0

	getCalendarPicker: (event) ->
		# Build calendar picker
		calendarPicker: $('#templates .calendar-picker').clone()
		swatches: $('.calendar-swatches', calendarPicker)
		name: $('.calendar-name', calendarPicker)
		
		$.each @eventLoader.calendars, (i, calendar) =>
			return unless calendar.editable
			
			color: calendar.getColor().getValue()

			do_hover_on: ->
				name.text(calendar.getTitle().getText())
				
			do_hover_off: ->
				name.text('')

			do_click: =>
				@changeCalendar(event, i)

			$('#templates .calendar-swatch')
				.clone()
				.css('background-color', @colourMap[color])
				.attr('id', 'calendar-swatch-' + i)
				.hover(do_hover_on, do_hover_off)
				.click(do_click)
				.appendTo(swatches)

		return calendarPicker

	changeCalendar: (event, calNumber) ->
		event.calNumber: calNumber
		@setColour event, calNumber

	setColour: (event, calNumber) ->
		color: @eventLoader.calendars[calNumber].getColor().getValue()
		$('.inner', event.eventDOM).css('background-color', @colourMap[color])


