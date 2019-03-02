import { manager } from './manager'

var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(req, res, next) {
    res.send('<h1>Hello world</h1>');
});

http.listen(3001, function(){
  console.log('listening on *:3001')
});

io.on('connection', (socket) => {
  manager.addClient(socket)
})