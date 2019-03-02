import { manager } from './manager'

var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

http.listen(3001, function(){
  console.log('listening on *:3001')
});

io.on('connection', (socket) => {
  manager.addClient(socket)
})