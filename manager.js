import config from "./config.json"

class Manager {
  constructor() {
    this.clients = {}

    this.onClientDisconnect = this.onClientDisconnect.bind(this)
    this.onClientCreatureExit = this.onClientCreatureExit.bind(this)
  }

  get noClients() {
    return Object.keys(this.clients).length
  }

  addClient(socket) {

    const client = new Client({
      id: socket.id,
      socket: socket,
      onDisconnect: this.onClientDisconnect,
      onCreatureExit: this.onClientCreatureExit
    })

    this.clients[socket.id] = client

    // If this is the first client in current session, send the creature over to them.
    if (this.noClients == 1) {
      this.passCreatureTo(client, { x: 0, y: 0 })
    }

    console.log('Connected: ', socket.id, this.noClients)
  }

  onClientDisconnect(id) {
    delete this.clients[id]
    console.log('disconnected: ', id, this.noClients)
  }

  onClientCreatureExit(id, position) {
    console.log('Creature exited: ', id, position)
    this.moveCreature(id, position)
  }

  moveCreature(prevId, lastPosition) {
    // Get all clients
    const clientsAll = Object.values(this.clients)

    // Filter down to clients who are active (sent a heartbeat recently)
    const clientsActive = clientsAll.filter((client) => client.isActive)

    // Filter down to all clients except for the previous one, is possible
    const clients = clientsActive.length <= 1 ? clientsActive : clientsActive.filter((client) => client.id != prevId)

    // Find the minimum number of times the creature has visited a client
    const minOwned = clients.reduce((acc, client) => Math.min(acc, client.creatureTotalCount), 100000)

    // Get all clients who've been visited least by the creature
    const candidates = clients.filter((client) => (client.creatureTotalCount == minOwned))

    // Select the next client at random
    const nextClient = candidates[parseInt(Math.floor(Math.random() * candidates.length))]

    // Pass creature to next client
    this.passCreatureTo(nextClient, lastPosition)
  }

  passCreatureTo(client, position) {
    if (!client) return
    client.acquireCreature(position)

    // If client has been holding on to the creature for too long, move on.
    const clientCurrCreatureCount = client.creatureTotalCount
    setTimeout(() => {
      if (client.hasCreature && client.creatureTotalCount == clientCurrCreatureCount && !client.isActive) {
        console.log('THIS IS A FORCED RELEASE')
        client.releaseCreature({ x: 0, y: 0})
      }
    }, config.CREATURE_FORCE_MOVE_MS)
  }
}

export const manager = new Manager()

class Client {
  constructor({ id, socket, onDisconnect, onCreatureExit }) {
    this.id = id
    this.socket = socket
    this.onDisconnect = onDisconnect
    this.onCreatureExit = onCreatureExit

    this.creatureTotalCount = 0
    this.hasCreature = false

    this.heartbeatTimestamp = Date.now()

    this.socketSetup()
  }

  get isActive() {
    return (Date.now() - this.heartbeatTimestamp) < config.CLIENT_HEARTBEAT_INACTIVE_THRESHOLD
  }

  acquireCreature(position) {
    console.log('acquireCreature: ', this.id)
    this.socket.emit('acquireCreature', position)
    this.creatureTotalCount++
    this.hasCreature = true
  }

  releaseCreature(position) {
    if (!this.hasCreature) return
    this.hasCreature = false
    this.onCreatureExit(this.id, position)    
  }

  socketSetup() {
    this.socket.on('creatureExit', (position) => {
      this.releaseCreature(position)
    })

    this.socket.on('disconnect', () => {
      this.releaseCreature({ x: 0, y: 0 })
      this.onDisconnect(this.id)
    })

    this.socket.on('heartbeat', () => {
      // console.log(this.id, ' heartbeat')
      this.heartbeatTimestamp = Date.now()
    })
  }

  socketEmit(evt, data) {
    this.socket.emit(evt, data)
  }
}