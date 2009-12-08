window.Loading = function() {
	var me = this;
	
	me.show = function(text) {
		$("#loading").fadeIn();
	}

	me.hide = function() {
		$("#loading").fadeOut();
	}
	
};
