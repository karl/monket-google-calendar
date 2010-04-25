(function(){
  window.Loading = function Loading() {  };
  window.Loading.prototype.show = function show(text) {
    return $("#loading").fadeIn();
  };
  window.Loading.prototype.hide = function hide() {
    return $("#loading").fadeOut();
  };
})();
