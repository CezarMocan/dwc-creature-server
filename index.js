import { manager } from './manager'
import bodyParser from 'body-parser'
import config from './config.json'

const GARDEN_NAME = process.argv[2]
const GARDEN_CONFIG = config.gardens[GARDEN_NAME]

console.log('Starting garden: ', GARDEN_NAME)
console.dir(GARDEN_CONFIG)

var app = require('express')()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

var http = require('http').Server(app)
var io = require('socket.io')(http)
var port = GARDEN_CONFIG.port || 3001;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

http.listen(port, function(){
  console.log('listening on *:', port)
})


// A client connected to the garden
io.on('connection', (socket) => {
  manager.addClient(socket)
})

// Creature entering the garden
// curl -d 'creature=2' http://localhost:3001/hello
app.post('/hello', (req, res, next) => {
  const creatureId = req.body.creature

  if (!creatureId) {
    const msg = 'Warning: The request does not have a "creature" parameter'
    console.warn(msg)
    res.send(msg)
    return
  }

  manager.helloCreature(creatureId)

  const msg = 'Creature ' + creatureId + ' has successfully entered the garden'
  console.log(msg)
  res.send(msg)
})

// Creature leaving the garden
// curl -d 'creature=2' http://localhost:3001/goodbye
app.post('/goodbye', (req, res, next) => {
  const creatureId = req.body.creature

  if (!creatureId) {
    const msg = 'Warning: The request does not have a "creature" parameter'
    console.warn(msg)
    res.send(msg)
    return    
  }

  manager.goodbyeCreature(creatureId)
  
  const msg = 'Creature ' + creatureId + ' has successfully left the garden'
  console.log(msg)
  res.send(msg)
})