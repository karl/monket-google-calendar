describe 'GoogleEventLoader', ->

  it 'should be newable without any exceptions', ->
    loader: new MKT.GoogleEventLoader(null, null)
    expect(loader).not.toBeNull()
  
  it 'should call the failure callback when getAllCalendarsFeed fails', ->
    loading: {
      show: ->
      hide: ->
    }
    service: {
      getAllCalendarsFeed: (url, success, failure) ->
        failure()
    }
    success: ->
    failure: jasmine.createSpy()
    
    loader: new MKT.GoogleEventLoader(service, loading)
    loader.init success, failure
    
    expect(failure).wasCalled()