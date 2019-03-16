var gardenName

export const setGarden = (name) => {
  gardenName = name
}

export const CREATURE_FORCE_MOVE_MS = 10000
export const CLIENT_HEARTBEAT_INACTIVE_THRESHOLD = 4000
export const GARDENS = {
  "alpha": {
    "address": "http://localhost",
    "port": 3001,
    name: "alpha"
  },
  "beta": {
    "address": "http://localhost",
    "port": 3002,
    name: "beta"
  },
  "gamma": {
    "address": "http://localhost",
    "port": 3003,
    name: "gamma"
  }
}

export const CREATURES = {

}

export const getGardenConfig = () => {
  return GARDENS[gardenName]
}

export const getGardenName = () => {
  return gardenName
}

export const getOtherGardens = () => {
  const otherGardens = {}
  Object.keys(GARDENS).forEach(garden => {
    if (garden == gardenName) return
    otherGardens[garden] = {...GARDENS[garden]}
  })  
  return otherGardens
}

export const getOtherGardenAddress = (name) => {
  return `${GARDENS[name].address}:${GARDENS[name].port}`
}