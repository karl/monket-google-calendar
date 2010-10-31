(function() {
  describe('Date.parseYMD', function() {
    it('should succeed with a valid date string', function() {
      return expect(Date.parseYMD('1234-01-26')).toEqual(new Date(1234, 0, 26));
    });
    return it('should throw an exception if the date string is not a valid format', function() {
      return expect(function() {
        return Date.parseYMD('1234-01');
      }).toThrow();
    });
  });
}).call(this);
