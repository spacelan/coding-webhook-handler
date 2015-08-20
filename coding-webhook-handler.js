const EventEmitter = require('events').EventEmitter,
  bl = require('bl')


function create(options) {
  if (typeof options != 'object')
    throw new TypeError('must provide an options object')

  if (typeof options.path != 'string')
    throw new TypeError('must provide a \'path\' option')

    // make it an EventEmitter, sort of
  handler.__proto__ = EventEmitter.prototype
  EventEmitter.call(handler)

  return handler


  function handler(req, res, callback) {
    if (req.url.split('?').shift() !== options.path)
      return callback()

    function hasError(msg) {
      res.writeHead(400, {
        'content-type': 'application/json'
      })
      res.end(JSON.stringify({
        error: msg
      }))

      var err = new Error(msg)

      handler.emit('error', err, req)
      callback(err)
    }

    var agent = req.headers['user-agent'],
      event = req.headers['x-coding-event']

    if (agent !== 'Coding.net Hook')
      return hasError('Invalid User-Agent')

    if (!event)
      return hasError('No X-Coding-Event found on request')

    req.pipe(bl(function(err, data) {
      if (err) {
        return hasError(err.message)
      }

      var obj

      try {
        obj = JSON.parse(data.toString())
      } catch (e) {
        return hasError(e)
      }

      if(obj.token !== options.token)
        return hasError('The token does not match')

      res.writeHead(200, {
        'content-type': 'application/json'
      })

      res.end(JSON.stringify({
        zen: 'Coding！ 让开发更简单'
      }))

      var emitData = {
        event: event,
        payload: obj,
        protocol: req.protocol,
        host: req.headers['host'],
        url: req.url
      }

      handler.emit(event, emitData)
      handler.emit('*', emitData)
    }))
  }
}

module.exports = create