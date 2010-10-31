(function() {
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  MKT.EventCreator = function(eventLoader, colourMap, config) {
    this.eventLoader = eventLoader;
    this.colourMap = colourMap;
    this.config = config;
    return this;
  };
  MKT.EventCreator.prototype.create = function(event) {
    var eventDOM;
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
    event.eventDOM = eventDOM;
    this.setColour(event, event.calNumber);
    if (event.editable) {
      this.makeEditable(event);
    }
    return eventDOM;
  };
  MKT.EventCreator.prototype.makeEditable = function(event) {
    this.makeDraggable(event);
    this.makeResizable(event);
    return event.eventDOM.click(__bind(function() {
      return this.click(event);
    }, this));
  };
  MKT.EventCreator.prototype.makeDraggable = function(event) {
    var do_drag, do_drag_stop, do_start_drag, dragging;
    dragging = {};
    do_start_drag = __bind(function(ev, ui) {
      dragging.start = event.start;
      dragging.end = event.end;
      dragging.day = null;
      return $('#body').mousemove(__bind(function(e) {
        return (dragging.day = $(e.target).parents('.day').add(e.target));
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
        return event.start - oldStart !== 0 || event.end - oldEnd !== 0 ? this.eventLoader.updateEvent(event, oldStart, oldEnd) : null;
      }
    }, this);
    do_drag_stop = __bind(function() {
      $('#body').unbind('mousemove');
      if (event.start - dragging.start !== 0 || event.end - dragging.end !== 0) {
        event.eventDOM.addClass('updating');
        return event.save(__bind(function() {
          console.log('Moved event', arguments);
          return event.eventDOM.removeClass('updating');
        }, this), __bind(function() {
          console.log('Failed to move event :(', arguments);
          event.eventDOM.removeClass('updating');
          return event.eventDOM.addClass('error');
        }, this));
      }
    }, this);
    return event.eventDOM.draggable({
      revert: true,
      distance: 10,
      helper: function() {
        return $('<div>');
      },
      scroll: false,
      cursor: 'move',
      handle: $('.text', event.eventDOM),
      start: do_start_drag,
      drag: do_drag,
      stop: do_drag_stop
    });
  };
  MKT.EventCreator.prototype.makeResizable = function(event) {
    var do_resize, do_resize_start, do_resize_stop, handles, resizing;
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
        return (resizing.day = $(e.target).parents('.day').add(e.target));
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
        return event.start - oldStart !== 0 || event.end - oldEnd !== 0 ? this.eventLoader.updateEvent(event, oldStart, oldEnd) : null;
      }
    }, this);
    do_resize_stop = __bind(function(e, ui) {
      $('#body').unbind('mousemove');
      event.eventDOM.remove();
      this.eventLoader.updateEvent(event);
      event.eventDOM.addClass('updating');
      return event.start - resizing.start !== 0 || event.end - resizing.end !== 0 ? event.save(__bind(function() {
        console.log('Resized event', arguments);
        return event.eventDOM.removeClass('updating');
      }, this), __bind(function() {
        console.log('Failed to resize event :(', arguments);
        event.eventDOM.removeClass('updating');
        return event.eventDOM.addClass('error');
      }, this)) : null;
    }, this);
    return event.isStart || event.isEnd ? event.eventDOM.resizable({
      handles: handles.join(', '),
      ghost: true,
      start: do_resize_start,
      resize: do_resize,
      stop: do_resize_stop
    }) : null;
  };
  MKT.EventCreator.prototype.click = function(event) {
    var calendarPicker, delButton, deleteEvent, editor, parent, removeEditor, startCalNumber, startText, top;
    if (event.eventDOM.hasClass('editing')) {
      return null;
    }
    editor = $('#templates .editor').clone();
    delButton = $('#templates .delete').clone();
    calendarPicker = this.getCalendarPicker(event);
    startText = $('.text', event.eventDOM).text();
    startCalNumber = event.calNumber;
    $('textarea', editor).text(event.isNew ? 'New event...' : startText);
    $('textarea', editor).height($('.text', event.eventDOM).height());
    $('textarea', editor).keyup(function() {
      var height, text;
      text = $('textarea', editor).val();
      $("#layout-event").width((event.weekLength * 14.2857) + "%");
      height = $("#layout-event .text").text(text).outerHeight();
      $('textarea', editor).height(height);
      return event.eventDOM.css('border', 'none');
    }).keyup();
    parent = event.eventDOM.parent();
    top = event.eventDOM.css('top');
    event.eventDOM.css({
      top: event.eventDOM.offset().top,
      left: event.eventDOM.offset().left
    });
    event.eventDOM.appendTo($('body'));
    $('.text', event.eventDOM).hide();
    $('.inner', event.eventDOM).append(editor);
    delButton.appendTo(event.eventDOM).hide().fadeIn();
    calendarPicker.appendTo(event.eventDOM).hide().fadeIn();
    $('textarea', editor).focus().select();
    event.eventDOM.addClass('editing');
    event.eventDOM.removeClass('error');
    deleteEvent = __bind(function() {
      event.isDeleting = true;
      removeEditor();
      event.eventDOM.addClass('updating');
      event.eventDOM.addClass('deleting');
      return event.remove(__bind(function() {
        console.log('Deleted event', arguments);
        return event.eventDOM.remove();
      }, this), __bind(function() {
        console.log('Failed to delete event', arguments);
        event.eventDOM.removeClass('updating');
        event.eventDOM.removeClass('deleting');
        event.eventDOM.addClass('error');
        return (event.isDeleting = false);
      }, this));
    }, this);
    removeEditor = __bind(function(e) {
      var eventChanged, text;
      if (event === $((typeof e === "undefined" || e === null) ? undefined : e.target).parents('.event').data('event')) {
        return null;
      }
      text = $.trim($('textarea', editor).val());
      if (text === '' && !event.isDeleting) {
        deleteEvent();
        return null;
      }
      event.eventDOM.appendTo(parent);
      event.eventDOM.css('top', top);
      $('.text', event.eventDOM).text(text).show();
      event.summary = text;
      editor.remove();
      delButton.remove();
      calendarPicker.remove();
      event.eventDOM.removeClass('editing');
      this.eventLoader.updateEvent(event);
      eventChanged = text !== startText || event.calNumber !== startCalNumber;
      if (eventChanged && !event.isDeleting) {
        event.eventDOM.addClass('updating');
        event.save(__bind(function() {
          console.log('Updated event', arguments);
          return event.eventDOM.removeClass('updating');
        }, this), __bind(function(response) {
          console.log('Failed update event :(', arguments);
          event.eventDOM.removeClass('updating');
          return event.eventDOM.addClass('error');
        }, this), startCalNumber);
      } else if (event.isDeleteing) {
        event.eventDOM.addClass('updating');
      }
      $('body').unbind('click', removeEditor);
      return $("#body").unbind('mousewheel', removeEditor);
    }, this);
    $('textarea', editor).keyup(function(e) {
      if (e.keyCode === 13) {
        return removeEditor();
      } else if (e.keyCode === 27) {
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
      return $('#body').mousewheel(removeEditor);
    }, 0);
  };
  MKT.EventCreator.prototype.getCalendarPicker = function(event) {
    var calendarPicker, name, swatches;
    calendarPicker = $('#templates .calendar-picker').clone();
    swatches = $('.calendar-swatches', calendarPicker);
    name = $('.calendar-name', calendarPicker);
    $.each(this.eventLoader.calendars, __bind(function(i, calendar) {
      var color, do_click, do_hover_off, do_hover_on;
      if (!(calendar.editable)) {
        return null;
      }
      color = calendar.getColor().getValue();
      do_hover_on = function() {
        return name.text(calendar.getTitle().getText());
      };
      do_hover_off = function() {
        return name.text('');
      };
      do_click = __bind(function() {
        return this.changeCalendar(event, i);
      }, this);
      return $('#templates .calendar-swatch').clone().css('background-color', this.colourMap[color]).attr('id', 'calendar-swatch-' + i).hover(do_hover_on, do_hover_off).click(do_click).appendTo(swatches);
    }, this));
    return calendarPicker;
  };
  MKT.EventCreator.prototype.changeCalendar = function(event, calNumber) {
    event.calNumber = calNumber;
    return this.setColour(event, calNumber);
  };
  MKT.EventCreator.prototype.setColour = function(event, calNumber) {
    var color;
    color = this.eventLoader.calendars[calNumber].getColor().getValue();
    return $('.inner', event.eventDOM).css('background-color', this.colourMap[color]);
  };
}).call(this);
