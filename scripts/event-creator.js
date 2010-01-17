window.EventCreator = function(eventLoader, colourMap, config) {
	var me = this;
	me.eventLoader = eventLoader;
	me.colourMap = colourMap;
	me.config = config;
	
	me.create = function(event) {
		// Build the DOM object for the event
		var eventDOM = $("#templates .event").clone();
		eventDOM.data('event', event);

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
		
		var dragging = {};
		eventDOM.draggable({
			revert: true,
			distance: 10,
			helper: function() {
				return $('<div>');
			},
			scroll: false,
			cursor: 'move',
			handle: $('.text', eventDOM),
			start: function(ev, ui) {
				dragging.start = event.start;
				dragging.end = event.end;
			},
			drag: function() {

				var id = $('.day:hover').attr('id');
				var dateString = id.substring(me.config.dayIdPrefix.length);
				var date = Date.parse(dateString);
				
				var oldStart = event.start;
				var oldEnd = event.end;

				event.start = date;
				event.end = date.addDays(event.length);

				if (event.start - oldStart != 0 || event.end - oldEnd != 0) {
					me.eventLoader.updateEvent(event, oldStart, oldEnd);							
				}

				
			},
			stop: function() {

				if (event.start - dragging.start != 0 || event.end - dragging.end != 0) {

					// Update google event
					var when = new google.gdata.When();
					var startTime = new google.gdata.DateTime(event.start, true);
					var endTime = new google.gdata.DateTime(event.end, true);
					when.setStartTime(startTime);
					when.setEndTime(endTime);
					event.googleEvent.setTimes([when]);

					event.googleEvent.updateEntry(function(response) {

						console.log('Updated event!', arguments);
						event.googleEvent = response.entry;
						event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1);
				
				
					}, function() {

						console.log('Failed to update event :(', arguments);
				
					});
				}

			}
		});

		var resizing = {};
		eventDOM.resizable({
			handles: 'e, w',
			ghost: true,
			start: function(e, ui) {
				resizing.direction = $(e.originalTarget).hasClass('ui-resizable-w') ? 'start' :'end';
				resizing.x = e.pageX;
				resizing.y = e.pageY;

				resizing.start = event.start;
				resizing.end = event.end;
				console.log(resizing);
			},
			resize: function(e, ui) {
				
				var id = $('.day:hover').attr('id');
				var dateString = id.substring(me.config.dayIdPrefix.length);
				var date = Date.parse(dateString);
				
				var oldStart = event.start;
				var oldEnd = event.end;
				
				if (resizing.direction == 'start') {
					event.start = date < resizing.end ? date : resizing.end.addDays(-1);
				} else if (resizing.direction == 'end') {
					event.end = date > resizing.start ? date.addDays(1) : resizing.start.addDays(1);
				}

				event.length = Math.round((event.end - event.start) / (1000 * 60 * 60 * 24));

				if (event.start - oldStart != 0 || event.end - oldEnd != 0) {
					me.eventLoader.updateEvent(event, oldStart, oldEnd);							
				}

			},
			stop: function(e, ui) {
				eventDOM.remove();
				me.eventLoader.updateEvent(event);							

				if (event.start - resizing.start != 0 || event.end - resizing.end != 0) {
					// Update google event
					var when = new google.gdata.When();
					var startTime = new google.gdata.DateTime(event.start, true);
					var endTime = new google.gdata.DateTime(event.end, true);
					when.setStartTime(startTime);
					when.setEndTime(endTime);
					event.googleEvent.setTimes([when]);

					event.googleEvent.updateEntry(function(response) {

						console.log('Updated event!', arguments);
						event.googleEvent = response.entry;
						event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1);


					}, function() {

						console.log('Failed to update event :(', arguments);

					});
				}
				
			}
		});
		
		eventDOM.click(function() {
			if (eventDOM.hasClass('editing')) {
				return;
			}
			
			var editor = $('#templates .editor').clone();

			var startText = $('.text', eventDOM).text();

			$('textarea', editor).text(event.isNew ? 'New event...' : startText);
			$('textarea', editor).height($('.text', eventDOM).height());
			$('textarea', editor).keyup(function() {
				var text = $('textarea', editor).val();
				
				// set width of layout event
				$("#layout-event").width((event.weekLength * 14.2857) + "%");			
				var height = $("#layout-event .text").text(text).outerHeight();
				
				$('textarea', editor).height(height);
				eventDOM.css('border', 'none');
			}).keyup();
			
			var parent = eventDOM.parent();
			var top = eventDOM.css('top');
			
			eventDOM.css({ 
				top: eventDOM.offset().top,
				left: eventDOM.offset().left
			});
			eventDOM.appendTo($('body'));
						
			$('.text', eventDOM).hide();			
			$('.inner', eventDOM).append(editor);
			$('textarea', editor).focus().select();
			eventDOM.addClass('editing');
			eventDOM.removeClass('error');
			
			var deleteEvent = function() {
				event.isDeleting = true;
				removeEditor();
				
				if (event.googleEvent) {
					event.googleEvent.deleteEntry(function() {
						$.log('Deleted event', arguments);
						me.removeEvent(event, eventDOM);
						
					}, function() {
						$.log('Failed to delete event', arguments);
						eventDOM.removeClass('updating');
						eventDOM.addClass('error');
						event.isDeleting = false;
					});
				} else {
					me.removeEvent(event, eventDOM);
				}				
			};
			
			var removeEditor = function(e) {
				if (!e || !$(e.target).parent().hasClass('editor')) {
					var text = $.trim($('textarea', editor).val());
					if (text == '' && !event.isDeleting) {
						deleteEvent();
						return;
					}
					
					eventDOM.appendTo(parent);
					eventDOM.css('top', top);
					
					$('.text', eventDOM).text(text).show();
					event.summary = text;
					editor.remove();
					eventDOM.removeClass('editing');


					me.eventLoader.updateEvent(event);	
									
					if (text != startText && !event.isDeleting) {
						eventDOM.addClass('updating');
						
						if (event.googleEvent) {
						
							event.googleEvent.setTitle(google.gdata.Text.create(text));
							event.googleEvent.updateEntry(function(response) {
							
								$.log('Updated event!', arguments);
								event.googleEvent = response.entry;
								eventDOM.removeClass('updating');
							
							}, function() {
							
								$.log('Failed to update event :(', arguments);
								eventDOM.removeClass('updating');
								eventDOM.addClass('error');
							
							});
						
						} else {

							me.createNewGoogleEvent(event, eventDOM);
							
						}
						
						// Force a refresh of the weeks that are affected
					} else if (event.isDeleteing) {
						eventDOM.addClass('updating');						
					} 
				
					$('body').unbind('click', removeEditor);
					$("#body").unbind('mousewheel', removeEditor);
				}
			};

			$('textarea', editor).keyup(function(e) {
				if(e.keyCode == 13) {
					removeEditor();
				} else if(e.keyCode == 27) {
					$('textarea', editor).val(startText);
					removeEditor();
				}
			});
			
			$('textarea', editor).keypress(function(e) {
				if(e.keyCode == 13) {
					e.preventDefault();
				}
			});
			
			setTimeout(function() {
				$('.delete', editor).click(function(e) {
					deleteEvent();		
					e.stopPropagation();
				});			

				$('body').click(removeEditor);
				$("#body").mousewheel(removeEditor);
			}, 0);
			
		});
		
		if (event.isNew) {
			eventDOM.addClass('new');
		}		

		return eventDOM;
	};
	
	me.createNewGoogleEvent = function(event, eventDOM) {
		me.eventLoader.createEvent(event, function(response) {

			$.log('Created event');
			event.googleEvent = response.entry;
			eventDOM.removeClass('updating');
			event.isNew = false;
			event.id = response.entry.getId();
			
		}, function() {

			$.log('Failed to create event');
			eventDOM.removeClass('updating');
			eventDOM.addClass('error');
			
		});		
	};
	
	me.removeEvent = function(event, eventDOM) {
		eventDOM.remove();
		me.eventLoader.removeEvent(event);
	};
	
};