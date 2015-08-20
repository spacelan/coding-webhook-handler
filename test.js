const test = require('tape'),
  handler = require('./'),
  through2 = require('through2')


function mkReq(url) {
  var req = through2()
  req.url = url
  req.headers = {
    'user-agent': 'Coding.net Hook',
    'x-coding-event': 'star'
  }
  return req
}


function mkRes() {
  var res = {
    writeHead: function(statusCode, headers) {
      res.$statusCode = statusCode
      res.$headers = headers
    }

    ,
    end: function(content) {
      res.$end = content
    }
  }

  return res
}


test('handler without full options throws', function(t) {
  t.plan(3)

  t.equal(typeof handler, 'function', 'handler exports a function')

  t.throws(handler, /must provide an options object/, 'throws if no options')

  t.throws(handler.bind(null, {}), /must provide a 'path' option/, 'throws if no path option')
})


test('handler ignores invalid urls', function(t) {
  var options = {
      path: '/some/url',
      token: 'bogus'
    },
    h = handler(options)

  t.plan(6)

  h(mkReq('/'), mkRes(), function(err) {
    t.error(err)
    t.ok(true, 'request was ignored')
  })

  // near match
  h(mkReq('/some/url/'), mkRes(), function(err) {
    t.error(err)
    t.ok(true, 'request was ignored')
  })

  // partial match
  h(mkReq('/some'), mkRes(), function(err) {
    t.error(err)
    t.ok(true, 'request was ignored')
  })
})


test('handler accepts valid urls', function(t) {
  var options = {
      path: '/some/url',
      token: 'bogus'
    },
    h = handler(options)

  t.plan(1)

  h(mkReq('/some/url'), mkRes(), function(err) {
    t.error(err)
    t.fail(false, 'should not call')
  })

  h(mkReq('/some/url?test=param'), mkRes(), function(err) {
    t.error(err)
    t.fail(false, 'should not call')
  })

  setTimeout(t.ok.bind(t, true, 'done'))
})


// because we don't inherit in a traditional way
test('handler is an EventEmitter', function(t) {
  t.plan(5)

  var h = handler({
    path: '/',
    token: 'bogus'
  })

  t.equal(typeof h.on, 'function', 'has h.on()')
  t.equal(typeof h.emit, 'function', 'has h.emit()')
  t.equal(typeof h.removeListener, 'function', 'has h.removeListener()')

  h.on('ping', function(pong) {
    t.equal(pong, 'pong', 'got event')
  })

  h.emit('ping', 'pong')

  t.throws(h.emit.bind(h, 'error', new Error('threw an error')), /threw an error/, 'acts like an EE')
})


test('handler accepts a valid token', function(t) {
  t.plan(4)

  var obj = {
      str: 'coding',
      num: 1,
      token: 'bogus'
    },
    json = JSON.stringify(obj),
    h = handler({
      path: '/',
      token: 'bogus'
    }),
    req = mkReq('/'),
    res = mkRes()

  req.headers['x-coding-event'] = 'push'

  h.on('push', function(event) {
    t.equal(event.payload.str, obj.str)
    t.equal(res.$statusCode, 200, 'correct status code')
    t.deepEqual(res.$headers, {
      'content-type': 'application/json'
    })
    t.equal(res.$end, '{"zen":"Coding！ 让开发更简单"}', 'got correct content')
  })

  h(req, res, function(err) {
    t.error(err)
    t.fail(true, 'should not get here!')
  })

  process.nextTick(function() {
    req.end(json)
  })
})

test('handler accepts no token', function(t) {
  t.plan(4)

  var obj = {
      str: 'coding',
      num: 1
    },
    json = JSON.stringify(obj),
    h = handler({
      path: '/'
    }),
    req = mkReq('/'),
    res = mkRes()

  req.headers['x-coding-event'] = 'push'

  h.on('push', function(event) {
    t.equal(event.payload.str, obj.str)
    t.equal(res.$statusCode, 200, 'correct status code')
    t.deepEqual(res.$headers, {
      'content-type': 'application/json'
    })
    t.equal(res.$end, '{"zen":"Coding！ 让开发更简单"}', 'got correct content')
  })

  h(req, res, function(err) {
    t.error(err)
    t.fail(true, 'should not get here!')
  })

  process.nextTick(function() {
    req.end(json)
  })
})

test('handler rejects a invalid token', function(t) {
  t.plan(6)

  var obj = {
      str: 'coding',
      num: 1,
      token: 'bogus'
    },
    json = JSON.stringify(obj),
    h = handler({
      path: '/',
      token: 'invalid token'
    }),
    req = mkReq('/'),
    res = mkRes()

  req.headers['x-coding-event'] = 'push'

  h.on('error', function(err, _req) {
    t.ok(err, 'got an error')
    t.strictEqual(_req, req, 'was given original request object')
    t.equal(res.$statusCode, 400, 'correct status code')
    t.deepEqual(res.$headers, {
      'content-type': 'application/json'
    })
    t.equal(res.$end, '{"error":"The token does not match"}', 'got correct content')
  })

  h.on('push', function(event) {
    t.fail(true, 'should not get here!')
  })

  h(req, res, function(err) {
    t.ok(err, 'got error on callback')
  })

  process.nextTick(function() {
    req.end(json)
  })
})

test('handler responds on a bl error', function(t) {
  t.plan(4)

  var obj = {
      str: 'coding',
      num: 1,
      token: 'bogus'
    },
    json = JSON.stringify(obj),
    h = handler({
      path: '/',
      token: 'bogus'
    }),
    req = mkReq('/'),
    res = mkRes()

  req.headers['x-coding-event'] = 'star'

  h.on('push', function(event) {
    t.fail(true, 'should not get here!')
  })

  h.on('issue', function(event) {
    t.fail(true, 'should never get here!')
  })

  h.on('error', function(err) {
    t.ok(err, 'got an error')
    t.equal(res.$statusCode, 400, 'correct status code')
  });

  h(req, res, function(err) {
    t.ok(err)
  })

  var end = res.end
  res.end = function() {
    t.equal(res.$statusCode, 400, 'correct status code')
  }

  req.write('{')
  process.nextTick(function() {
    req.emit('error', new Error('simulated explosion'))
  });
})