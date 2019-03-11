import config from "./config.json"

export default class Client {
  constructor({ id, socket, onDisconnect, onCreatureExit }) {
    this.id = id
    this.socket = socket
    this.onDisconnect = onDisconnect
    this.onCreatureExit = onCreatureExit

    this.creatureTotalCount = 0
    this.creatureOwnership = {}

    this.heartbeatTimestamp = Date.now()

    this.socketSetup()
  }

  socketSetup() {
    this.socket.on('creatureExit', ({ creatureId }) => {
      this.releaseCreature(creatureId)
    })

    this.socket.on('disconnect', () => {
      this.releaseAllCreatures()
      this.onDisconnect(this.id)
    })

    this.socket.on('heartbeat', () => {
      this.heartbeatTimestamp = Date.now()
    })
  }

  get isActive() {
    return (Date.now() - this.heartbeatTimestamp) < config.CLIENT_HEARTBEAT_INACTIVE_THRESHOLD
  }

  hasCreature(creatureId) {
    return !!this.creatureOwnership[creatureId]
  }

  acquireCreature(creatureId) {
    console.log('acquireCreature: ', creatureId, this.id)
    this.creatureTotalCount++
    this.creatureOwnership[creatureId] = true
    this.socket.emit('acquireCreature', { creatureId })
  }

  releaseCreature(creatureId) {
    if (!this.hasCreature(creatureId)) return
    delete this.creatureOwnership[creatureId]
    this.onCreatureExit(creatureId, this.id)
  }

  releaseAllCreatures() {
    Object.keys(this.creatureOwnership).forEach(creatureId => {
      this.releaseCreature(creatureId)
    })
  }
}