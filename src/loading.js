(function() {
  MKT.Loading = function() {};
  MKT.Loading.prototype.show = function(text) {
    return $("#loading").fadeIn();
  };
  MKT.Loading.prototype.hide = function() {
    return $("#loading").fadeOut();
  };
}).call(this);
