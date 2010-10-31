(function() {
  describe('GoogleEventLoader', function() {
    it('should be newable without any exceptions', function() {
      ({
        loader: new MKT.GoogleEventLoader(null, null)
      });
      return expect(loader).not.toBeNull();
    });
    return it('should call the failure callback when getAllCalendarsFeed fails', function() {
      ({
        loading: {
          show: function() {},
          hide: function() {}
        },
        service: {
          getAllCalendarsFeed: function(url, success, failure) {
            return failure();
          }
        },
        success: function() {},
        failure: jasmine.createSpy(),
        loader: new MKT.GoogleEventLoader(service, loading)
      });
      loader.init(success, failure);
      return expect(failure).wasCalled();
    });
  });
}).call(this);
