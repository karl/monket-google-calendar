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
		eventDOM.addClass'new' if event.isNew

		@setColour eventDOM, event.calNumber
		@makeEditable event, eventDOM if event.editable

		return eventDOM

	makeEditable: (event, eventDOM) ->
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

				# Update google event
				event_when: new google.gdata.When()
				startTime: new google.gdata.DateTime(event.start, true)
				endTime: new google.gdata.DateTime(event.end, true)
				event_when.setStartTime(startTime)
				event_when.setEndTime(endTime)
				event.googleEvent.setTimes([event_when])

				event.googleEvent.updateEntry ((response) =>
					console.log('Updated event!', arguments)
					event.googleEvent: response.entry
					event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1)
				), =>
					console.log('Failed to update event :(', arguments)
		
		eventDOM.draggable {
			revert: true
			distance: 10
			helper: ->
				$('<div>')
			scroll: false
			cursor: 'move'
			handle: $('.text', eventDOM)
			start: do_start_drag
			drag: do_drag
			stop: do_drag_stop
		}

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

			eventDOM.remove()
			@eventLoader.updateEvent(event)

			if event.start - resizing.start != 0 || event.end - resizing.end != 0
				# Update google event
				google_when: new google.gdata.When()
				startTime: new google.gdata.DateTime(event.start, true)
				endTime: new google.gdata.DateTime(event.end, true)
				google_when.setStartTime(startTime)
				google_when.setEndTime(endTime)
				event.googleEvent.setTimes([google_when])

				event.googleEvent.updateEntry ((response) ->
					console.log('Updated event!', arguments)
					event.googleEvent: response.entry
					event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1)
				), ->
					console.log('Failed to update event :(', arguments)
		
		if event.isStart || event.isEnd
			eventDOM.resizable {
				handles: handles.join(', ')
				ghost: true
				start: do_resize_start
				resize: do_resize
				stop: do_resize_stop
			}
	
		eventDOM.click =>
			@click event, eventDOM


	click: (event, eventDOM) ->
		return if eventDOM.hasClass('editing')

		editor: $('#templates .editor').clone()
		delButton: $('#templates .delete').clone()
		
		calendarPicker: @getCalendarPicker(event, eventDOM)

		startText: $('.text', eventDOM).text()
		startCalNumber: event.calNumber

		$('textarea', editor).text( if event.isNew then 'New event...' else startText)
		$('textarea', editor).height($('.text', eventDOM).height())
		$('textarea', editor).keyup( ->
			text: $('textarea', editor).val()
			
			# set width of layout event
			$("#layout-event").width((event.weekLength * 14.2857) + "%")
			height: $("#layout-event .text").text(text).outerHeight()
			
			$('textarea', editor).height(height)
			eventDOM.css('border', 'none')
		).keyup()
		
		parent: eventDOM.parent()
		top: eventDOM.css('top')
		
		eventDOM.css { 
			top: eventDOM.offset().top
			left: eventDOM.offset().left
		}
		eventDOM.appendTo $('body')
					
		$('.text', eventDOM).hide()
		
		$('.inner', eventDOM).append editor
		delButton.appendTo(eventDOM).hide().fadeIn()
		calendarPicker.appendTo(eventDOM).hide().fadeIn()
		
		$('textarea', editor).focus().select()
		eventDOM.addClass('editing')
		eventDOM.removeClass('error')
		
		deleteEvent: =>
			event.isDeleting: true
			removeEditor()
			
			if event.googleEvent
				event.googleEvent.deleteEntry ( =>
					$.log('Deleted event', arguments)
					@removeEvent(event, eventDOM)
				), ->
					$.log('Failed to delete event', arguments)
					eventDOM.removeClass('updating')
					eventDOM.addClass('error')
					event.isDeleting: false

			else
				@removeEvent event, eventDOM
		
		removeEditor: (e) =>
			if !e || $(e.target).parents('.editing').length == 0
				text: $.trim($('textarea', editor).val())
				if text == '' && !event.isDeleting
					deleteEvent()
					return
				
				eventDOM.appendTo(parent)
				eventDOM.css('top', top)
				
				$('.text', eventDOM).text(text).show()
				event.summary: text
				editor.remove()
				delButton.remove()
				calendarPicker.remove()
				eventDOM.removeClass('editing')

				@eventLoader.updateEvent(event)
								
				eventChanged: text != startText || event.calNumber != startCalNumber
				if eventChanged && !event.isDeleting
					eventDOM.addClass('updating')
					
					if event.googleEvent
						event.googleEvent.setTitle(google.gdata.Text.create(text))

						if event.calNumber != startCalNumber
							@eventLoader.moveToNewCalendar event, startCalNumber, ( ->
								$.log('Updated event', arguments)
								eventDOM.removeClass('updating')
							), (response) ->
								console.log(response)
								
								# TODO: reset event
								$.log('Failed to move event to new calendar :(', arguments)
								eventDOM.removeClass('updating')
								eventDOM.addClass('error')

						else
							@eventLoader.saveChanges event, ( ->
								$.log('Updated event', arguments)
								eventDOM.removeClass('updating')
							), ->
								# TODO: reset event
								$.log('Failed to update event :(', arguments)
								eventDOM.removeClass('updating')
								eventDOM.addClass('error')

					else
						event.isNew: false
						@createNewGoogleEvent event, eventDOM

				else if event.isDeleteing
					eventDOM.addClass('updating')
			
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

		setTimeout ( ->
			$(delButton).click (e) ->
				deleteEvent()
				e.stopPropagation()

			$('body').click(removeEditor)
			$("#body").mousewheel(removeEditor)
		), 0

	getCalendarPicker: (event, eventDOM) ->
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
				@changeCalendar(event, eventDOM, i)

			$('#templates .calendar-swatch')
				.clone()
				.css('background-color', @colourMap[color])
				.attr('id', 'calendar-swatch-' + i)
				.hover(do_hover_on, do_hover_off)
				.click(do_click)
				.appendTo(swatches)

		return calendarPicker

	changeCalendar: (event, eventDOM, calNumber) ->
		event.calNumber: calNumber
		@setColour eventDOM, calNumber

	setColour: (eventDOM, calNumber) ->
		color: @eventLoader.calendars[calNumber].getColor().getValue()
		$('.inner', eventDOM).css('background-color', @colourMap[color])

	createNewGoogleEvent: (event, eventDOM) ->
		@eventLoader.createEvent event, ( ->
			$.log('Created event')
			eventDOM.removeClass('updating')
		), ->
			$.log('Failed to create event')
			eventDOM.removeClass('updating')
			eventDOM.addClass('error')

	
	removeEvent: (event, eventDOM) ->
		eventDOM.remove()
		@eventLoader.removeEvent(event)

