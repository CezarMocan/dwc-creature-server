import config from "./config.json"
import Client from './Client'

const MOCK_CREATURE_ID = 12

class Manager {
  constructor() {
    this.clients = {}
    this.creatures = {}

    this.removeClient = this.removeClient.bind(this)
    this.onClientCreatureExit = this.onClientCreatureExit.bind(this)
  }

  get noClients() {
    return Object.keys(this.clients).length
  }

  addClient(socket) {

    const client = new Client({
      id: socket.id,
      socket: socket,
      onDisconnect: this.removeClient,
      onCreatureExit: this.onClientCreatureExit
    })

    this.clients[socket.id] = client

    // If this is the first client in current session, send the creature over to them.
    if (this.noClients == 1) {
      this.passCreatureTo(MOCK_CREATURE_ID, client, { x: 0, y: 0 })
    }

    console.log('Connected: ', socket.id, this.noClients)
  }

  removeClient(id) {
    delete this.clients[id]
    console.log('disconnected: ', id, this.noClients)
  }

  onClientCreatureExit(creatureId, clientId) {
    console.log('Creature exited: ', creatureId, clientId)
    this.moveCreature(creatureId, clientId)
  }

  helloCreature(creatureId) {
    if (this.creatures[creatureId]) {
      console.warn('Creature ' + creatureId + ' is already in this garden.\nNo action taken\n\n')
      return
    }

    this.creatures[creatureId] = {
      helloTimestamp: Date.now()
    }
  }

  goodbyeCreature(creatureId) {
    const creatureData = this.creatures[creatureId]
    delete this.creatures[creatureId]
  }

  moveCreature(creatureId, prevId) {
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
    this.passCreatureTo(MOCK_CREATURE_ID, nextClient)
  }

  passCreatureTo(creatureId, client) {
    if (!client) return
    client.acquireCreature(creatureId)

    // If client has been holding on to the creature for too long, move on.
    const clientCurrCreatureCount = client.creatureTotalCount

    setTimeout(() => {
      if (client.hasCreature(creatureId) && 
          client.creatureTotalCount == clientCurrCreatureCount && 
          !client.isActive) 
      {
        console.log('THIS IS A FORCED RELEASE')
        client.releaseCreature(creatureId)
      }

    }, config.CREATURE_FORCE_MOVE_MS)
  }
}

export const manager = new Manager()