import config from "./config.json"
import Client from './Client'

const MOCK_CREATURE_ID = 3

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

    // If this is the first client in current session, send all active creatures over to them.
    if (this.noClients == 1) {
      Object.keys(this.creatures).forEach((creatureId) => {
        this.passCreatureTo(creatureId, client)
      })
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

    this.moveCreature(creatureId, -1)
  }

  goodbyeCreature(creatureId) {
    if (!this.isCreaturePresent(creatureId)) return
    const creatureData = this.creatures[creatureId]
    delete this.creatures[creatureId]
  }

  isCreaturePresent(creatureId) {
    return !!this.creatures[creatureId]
  }

  moveCreature(creatureId, prevId) {
    // If the creature has already left the garden, do nothing
    if (!this.isCreaturePresent(creatureId)) return

    // Get all clients
    const clientsAll = Object.values(this.clients)

    // If no clients are connected, do nothing
    if (!clientsAll.length) return

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
    this.passCreatureTo(creatureId, nextClient)
  }

  passCreatureTo(creatureId, client) {
    if (!client) return
    client.acquireCreature(creatureId)

    // If client has been holding on to the creature for too long, move on.
    const clientCurrCreatureCount = client.creatureTotalCount

    setTimeout(() => {
      console.log('Force release check: ', client.hasCreature(creatureId), client.creatureTotalCount, clientCurrCreatureCount, client.isActive)
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