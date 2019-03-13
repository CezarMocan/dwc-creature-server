import { manager } from './manager'
import bodyParser from 'body-parser'
import { Creature } from 'dwc-creature'


let creature = new Creature({ initialData: { face: ':)' } })
creature.on('updated', console.dir)

creature.on('created', innerCreature => {
  var app = require('express')()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  var http = require('http').Server(app)
  var io = require('socket.io')(http)
  var port = process.env.PORT || 3001;

  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  })

  http.listen(port, function () {
    console.log('listening on *:3001')
  })

  // A client connected to the garden
  io.on('connection', (socket) => {
    manager.addClient(socket)
  })

  app.get('/creature', (req, res, next) => {
    res.send(creature.data())
  })

  app.post('/creature', (req, res, next) => {
    creature.update(req.body)
    res.send(creature.data())
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

})
creature.sync()
