describe 'Date.parseYMD', ->
  it 'should succeed with a valid date string', ->
    expect(Date.parseYMD '1234-01-26').toEqual(new Date 1234, 0, 26)

  it 'should throw an exception if the date string is not a valid format', ->
    expect( -> Date.parseYMD '1234-01').toThrow()
