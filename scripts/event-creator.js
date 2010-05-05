(function(){
  var __slice = Array.prototype.slice, __bind = function(func, obj, args) {
    return function() {
      return func.apply(obj || {}, args ? args.concat(__slice.call(arguments, 0)) : arguments);
    };
  };
  window.EventCreator = function EventCreator(eventLoader, colourMap, config) {
    this.eventLoader = eventLoader;
    this.colourMap = colourMap;
    this.config = config;
    return this;
  };
  window.EventCreator.prototype.create = function create(event) {
    var eventDOM;
    // Build the DOM object for the event
    eventDOM = $("#templates .event").clone();
    eventDOM.data('event', event);
    $(".text", eventDOM).text(event.summary);
    eventDOM.width((event.weekLength * 14.2857) + "%");
    if (!(event.isStart && event.isEnd)) {
      eventDOM.addClass("multi-week");
    }
    if (event.isStart) {
      eventDOM.addClass('start');
    }
    if (event.isEnd) {
      eventDOM.addClass('end');
    }
    if (event.summary.endsWith('?')) {
      eventDOM.addClass('tentative');
    }
    if (event.summary.endsWith('!')) {
      eventDOM.addClass('important');
    }
    if (event.isNew) {
      eventDOM.addClass('new');
    }
    this.setColour(eventDOM, event.calNumber);
    if (event.editable) {
      this.makeEditable(event, eventDOM);
    }
    return eventDOM;
  };
  window.EventCreator.prototype.makeEditable = function makeEditable(event, eventDOM) {
    var do_drag, do_drag_stop, do_resize, do_resize_start, do_resize_stop, do_start_drag, dragging, handles, resizing;
    dragging = {};
    do_start_drag = __bind(function(ev, ui) {
        dragging.start = event.start;
        dragging.end = event.end;
        dragging.day = null;
        return $('#body').mousemove(__bind(function(e) {
            dragging.day = $(e.target).parents('.day').add(e.target);
            return dragging.day;
          }, this));
      }, this);
    do_drag = __bind(function() {
        var date, dateString, id, oldEnd, oldStart;
        if (dragging.day) {
          id = dragging.day.attr('id');
          dateString = id.substring(this.config.dayIdPrefix.length);
          date = Date.parseYMD(dateString);
          oldStart = event.start;
          oldEnd = event.end;
          event.start = date;
          event.end = date.addDays(event.length);
          if (event.start - oldStart !== 0 || event.end - oldEnd !== 0) {
            return this.eventLoader.updateEvent(event, oldStart, oldEnd);
          }
        }
      }, this);
    do_drag_stop = __bind(function() {
        var endTime, event_when, startTime;
        $('#body').unbind('mousemove');
        if ((event.start - dragging.start !== 0 || event.end - dragging.end !== 0)) {
          // Update google event
          event_when = new google.gdata.When();
          startTime = new google.gdata.DateTime(event.start, true);
          endTime = new google.gdata.DateTime(event.end, true);
          event_when.setStartTime(startTime);
          event_when.setEndTime(endTime);
          event.googleEvent.setTimes([event_when]);
          return event.googleEvent.updateEntry(__bind(function(response) {
              console.log('Updated event!', arguments);
              event.googleEvent = response.entry;
              return event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1);
            }, this), __bind(function() {
              return console.log('Failed to update event :(', arguments);
            }, this));
        }
      }, this);
    eventDOM.draggable({
      revert: true,
      distance: 10,
      helper: function helper() {
        return $('<div>');
      },
      scroll: false,
      cursor: 'move',
      handle: $('.text', eventDOM),
      start: do_start_drag,
      drag: do_drag,
      stop: do_drag_stop
    });
    resizing = {};
    handles = [];
    if (event.isStart) {
      handles.push('w');
    }
    if (event.isEnd) {
      handles.push('e');
    }
    do_resize_start = __bind(function(e, ui) {
        resizing.direction = (e.pageX < (ui.originalPosition.left + (ui.originalSize.width / 2))) ? 'start' : 'end';
        resizing.x = e.pageX;
        resizing.y = e.pageY;
        resizing.start = event.start;
        resizing.end = event.end;
        resizing.day = null;
        return $('#body').mousemove(__bind(function(e) {
            resizing.day = $(e.target).parents('.day').add(e.target);
            return resizing.day;
          }, this));
      }, this);
    do_resize = __bind(function(e, ui) {
        var date, dateString, id, oldEnd, oldStart;
        if (resizing.day) {
          id = resizing.day.attr('id');
          dateString = id.substring(this.config.dayIdPrefix.length);
          date = Date.parseYMD(dateString);
          oldStart = event.start;
          oldEnd = event.end;
          if (resizing.direction === 'start') {
            event.start = date < resizing.end ? date : resizing.end.addDays(-1);
          } else if (resizing.direction === 'end') {
            event.end = date > resizing.start ? date.addDays(1) : resizing.start.addDays(1);
          }
          event.length = Math.round((event.end - event.start) / (1000 * 60 * 60 * 24));
          if (event.start - oldStart !== 0 || event.end - oldEnd !== 0) {
            return this.eventLoader.updateEvent(event, oldStart, oldEnd);
          }
        }
      }, this);
    do_resize_stop = __bind(function(e, ui) {
        var endTime, google_when, startTime;
        $('#body').unbind('mousemove');
        eventDOM.remove();
        this.eventLoader.updateEvent(event);
        if (event.start - resizing.start !== 0 || event.end - resizing.end !== 0) {
          // Update google event
          google_when = new google.gdata.When();
          startTime = new google.gdata.DateTime(event.start, true);
          endTime = new google.gdata.DateTime(event.end, true);
          google_when.setStartTime(startTime);
          google_when.setEndTime(endTime);
          event.googleEvent.setTimes([google_when]);
          return event.googleEvent.updateEntry(function(response) {
            console.log('Updated event!', arguments);
            event.googleEvent = response.entry;
            return event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1);
          }, function() {
            return console.log('Failed to update event :(', arguments);
          });
        }
      }, this);
    event.isStart || event.isEnd ? eventDOM.resizable({
      handles: handles.join(', '),
      ghost: true,
      start: do_resize_start,
      resize: do_resize,
      stop: do_resize_stop
    }) : null;
    return eventDOM.click(__bind(function() {
        return this.click(event, eventDOM);
      }, this));
  };
  window.EventCreator.prototype.click = function click(event, eventDOM) {
    var calendarPicker, delButton, deleteEvent, editor, parent, removeEditor, startCalNumber, startText, top;
    if (eventDOM.hasClass('editing')) {
      return null;
    }
    editor = $('#templates .editor').clone();
    delButton = $('#templates .delete').clone();
    calendarPicker = this.getCalendarPicker(event, eventDOM);
    startText = $('.text', eventDOM).text();
    startCalNumber = event.calNumber;
    $('textarea', editor).text(event.isNew ? 'New event...' : startText);
    $('textarea', editor).height($('.text', eventDOM).height());
    $('textarea', editor).keyup(function() {
      var height, text;
      text = $('textarea', editor).val();
      // set width of layout event
      $("#layout-event").width((event.weekLength * 14.2857) + "%");
      height = $("#layout-event .text").text(text).outerHeight();
      $('textarea', editor).height(height);
      return eventDOM.css('border', 'none');
    }).keyup();
    parent = eventDOM.parent();
    top = eventDOM.css('top');
    eventDOM.css({
      top: eventDOM.offset().top,
      left: eventDOM.offset().left
    });
    eventDOM.appendTo($('body'));
    $('.text', eventDOM).hide();
    $('.inner', eventDOM).append(editor);
    delButton.appendTo(eventDOM).hide().fadeIn();
    calendarPicker.appendTo(eventDOM).hide().fadeIn();
    $('textarea', editor).focus().select();
    eventDOM.addClass('editing');
    eventDOM.removeClass('error');
    deleteEvent = __bind(function() {
        event.isDeleting = true;
        removeEditor();
        if (event.googleEvent) {
          return event.googleEvent.deleteEntry(__bind(function() {
              $.log('Deleted event', arguments);
              return this.removeEvent(event, eventDOM);
            }, this), function() {
            $.log('Failed to delete event', arguments);
            eventDOM.removeClass('updating');
            eventDOM.addClass('error');
            event.isDeleting = false;
            return event.isDeleting;
          });
        } else {
          return this.removeEvent(event, eventDOM);
        }
      }, this);
    removeEditor = __bind(function(e) {
        var eventChanged, text;
        if (!e || $(e.target).parents('.editing').length === 0) {
          text = $.trim($('textarea', editor).val());
          if (text === '' && !event.isDeleting) {
            deleteEvent();
            return null;
          }
          eventDOM.appendTo(parent);
          eventDOM.css('top', top);
          $('.text', eventDOM).text(text).show();
          event.summary = text;
          editor.remove();
          delButton.remove();
          calendarPicker.remove();
          eventDOM.removeClass('editing');
          this.eventLoader.updateEvent(event);
          eventChanged = text !== startText || event.calNumber !== startCalNumber;
          if (eventChanged && !event.isDeleting) {
            eventDOM.addClass('updating');
            if (event.googleEvent) {
              event.googleEvent.setTitle(google.gdata.Text.create(text));
              event.calNumber !== startCalNumber ? this.eventLoader.moveToNewCalendar(event, startCalNumber, function() {
                $.log('Updated event', arguments);
                return eventDOM.removeClass('updating');
              }, function(response) {
                console.log(response);
                // TODO: reset event
                $.log('Failed to move event to new calendar :(', arguments);
                eventDOM.removeClass('updating');
                return eventDOM.addClass('error');
              }) : this.eventLoader.saveChanges(event, function() {
                $.log('Updated event', arguments);
                return eventDOM.removeClass('updating');
              }, function() {
                // TODO: reset event
                $.log('Failed to update event :(', arguments);
                eventDOM.removeClass('updating');
                return eventDOM.addClass('error');
              });
            } else {
              event.isNew = false;
              this.createNewGoogleEvent(event, eventDOM);
            }
          } else if (event.isDeleteing) {
            eventDOM.addClass('updating');
          }
          $('body').unbind('click', removeEditor);
          $("#body").unbind('mousewheel', removeEditor);
        }
      }, this);
    $('textarea', editor).keyup(function(e) {
      if (e.keyCode === 13) {
        return removeEditor();
      } else if (e.keyCode === 27) {
        // reset event
        $('textarea', editor).val(startText);
        event.calNumber = startCalNumber;
        return removeEditor();
      }
    });
    $('textarea', editor).keypress(function(e) {
      if (e.keyCode === 13) {
        return e.preventDefault();
      }
    });
    return setTimeout(function() {
      $(delButton).click(function(e) {
        deleteEvent();
        return e.stopPropagation();
      });
      $('body').click(removeEditor);
      return $("#body").mousewheel(removeEditor);
    }, 0);
  };
  window.EventCreator.prototype.getCalendarPicker = function getCalendarPicker(event, eventDOM) {
    var calendarPicker, name, swatches;
    // Build calendar picker
    calendarPicker = $('#templates .calendar-picker').clone();
    swatches = $('.calendar-swatches', calendarPicker);
    name = $('.calendar-name', calendarPicker);
    $.each(this.eventLoader.calendars, __bind(function(i, calendar) {
        var color, do_click, do_hover_off, do_hover_on;
        if (!(calendar.editable)) {
          return null;
        }
        color = calendar.getColor().getValue();
        do_hover_on = function do_hover_on() {
          return name.text(calendar.getTitle().getText());
        };
        do_hover_off = function do_hover_off() {
          return name.text('');
        };
        do_click = __bind(function() {
            return this.changeCalendar(event, eventDOM, i);
          }, this);
        return $('#templates .calendar-swatch').clone().css('background-color', this.colourMap[color]).attr('id', 'calendar-swatch-' + i).hover(do_hover_on, do_hover_off).click(do_click).appendTo(swatches);
      }, this));
    return calendarPicker;
  };
  window.EventCreator.prototype.changeCalendar = function changeCalendar(event, eventDOM, calNumber) {
    event.calNumber = calNumber;
    return this.setColour(eventDOM, calNumber);
  };
  window.EventCreator.prototype.setColour = function setColour(eventDOM, calNumber) {
    var color;
    color = this.eventLoader.calendars[calNumber].getColor().getValue();
    return $('.inner', eventDOM).css('background-color', this.colourMap[color]);
  };
  window.EventCreator.prototype.createNewGoogleEvent = function createNewGoogleEvent(event, eventDOM) {
    return this.eventLoader.createEvent(event, function() {
      $.log('Created event');
      return eventDOM.removeClass('updating');
    }, function() {
      $.log('Failed to create event');
      eventDOM.removeClass('updating');
      return eventDOM.addClass('error');
    });
  };
  window.EventCreator.prototype.removeEvent = function removeEvent(event, eventDOM) {
    eventDOM.remove();
    return this.eventLoader.removeEvent(event);
  };
})();
