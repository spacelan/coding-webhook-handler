# coding-webhook-handler

Coding allows you to register **[Webhooks](https://coding.net/help/about_us?key=webhook)** for your repositories. Each time an event occurs on your repository, whether it be pushing code, filling issues or creating pull requests, the webhook address you register can be configured to be pinged with details.

This library is a small handler (or "middleware" if you must) for Node.js web servers that handles all the logic of receiving and verifying webhook requests from Coding.

## Example

```js
var http = require('http')
var createHandler = require('coding-webhook-handler')
var handler = createHandler({
  path: '/webhook',
  token: 'mytoken'
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

handler.on('push', function(event) {
  console.log(event)
})

handler.on('issues', function(event) {
  console.log(event)
})

handler.on('*', function(event) {
  console.log(event)
})
```

## License

**github-webhook-handler** is Copyright (c) 2014 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licensed under the MIT License. All rights not explicitly granted in the MIT License are reserved. See the included [LICENSE.md](./LICENSE.md) file for more details.
