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
						console.log('Deleted event', arguments);
						me.removeEvent(event, eventDOM);
						
					}, function() {
						console.log('Failed to delete event', arguments);
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
							
								console.log('Updated event!', arguments);
								event.googleEvent = response.entry;
								eventDOM.removeClass('updating');
							
							}, function() {
							
								console.log('Failed to update event :(', arguments);
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

			console.log('Created event');
			event.googleEvent = response.entry;
			eventDOM.removeClass('updating');
			event.isNew = false;
			
		}, function() {

			console.log('Failed to create event');
			eventDOM.removeClass('updating');
			eventDOM.addClass('error');
			
		});		
	};
	
	me.removeEvent = function(event, eventDOM) {
		eventDOM.remove();
		me.eventLoader.removeEvent(event);
	};
	
};