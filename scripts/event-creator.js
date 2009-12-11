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

			$('textarea', editor).text(startText);
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
			eventDOM.addClass('editing');
			eventDOM.removeClass('error');
			
			var removeEditor = function(e) {
				if (!$(e.target).parent().hasClass('editor')) {
					eventDOM.appendTo(parent);
					eventDOM.css('top', top);
			
					var text = $('textarea', editor).val();
			
					$('.text', eventDOM).text(text).show();
					editor.remove();
					eventDOM.removeClass('editing');
									
					if (text != startText) {
						eventDOM.addClass('updating');
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
						
						// Force a refresh of the weeks that are affected
					}
				
					$('body').unbind('click', removeEditor);
					$("#body").unbind('mousewheel', removeEditor);
				}
			};
			
			setTimeout(function() {
				$('body').click(removeEditor);
				$("#body").mousewheel(removeEditor);
			}, 0);
			
			
			// For testing
			window.event = eventDOM;
		});

		return eventDOM;
	};
	
};