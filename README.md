# coding-webhook-handler

[![Build Status](https://travis-ci.org/spacelan/coding-webhook-handler.svg?branch=master)](https://travis-ci.org/spacelan/coding-webhook-handler)

Coding allows you to register **[Webhooks](https://coding.net/help/about_us?key=webhook)** for your repositories. Each time an event occurs on your repository, whether it be pushing code, filling issues or creating pull requests, the webhook address you register can be configured to be pinged with details.

This library is a fork of [github-webhook-handler](https://github.com/rvagg/github-webhook-handler). It is a small handler (or "middleware" if you must) for Node.js web servers that handles all the logic of receiving and verifying webhook requests from Coding.

## Example

```js
var http = require('http')
var createHandler = require('coding-webhook-handler')
var handler = createHandler({
  path: '/webhook',
  token: 'mytoken' // maybe there is no token
})

http.createServer(function(req, res) {
  handler(req, res, function(err) {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(7777)

handler.on('error', function(err) {
  console.error('Error:', err.message)
})

handler.on('*', function(event) {
  console.log(event.event)
  console.log(event.payload)
  console.log(event.protocol)
  console.log(event.host)
  console.log(event.url)
})

handler.on('push', function(event) {
  console.log(event)
})

handler.on('star', function(event) {
  console.log(event)
})
```

## License

MIT
