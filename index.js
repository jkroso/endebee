const {UUID,List,replaceSymbols} = require('edn-js')
const {compose,map} = require('transducer')
const type = require('jkroso-type')
const equal = require('equals')

class Entity extends UUID {
  toEDN() {
    return `#endebee/Entity "${this.toString()}"`
  }
}

class DB {
  constructor() {
    this.store = new Map
  }
  get(entity) {
    return this.store.get(entity)
  }
  set(entity, value) {
    return this.store.set(entity, value)
  }
  transact(tx) {
    var fn = interpret[tx.value]
    var val = tx.tail.value
    var val = replaceSymbols(val, txEnv(val))
    this.store = fn(this.store, val)
  }
  query(pattern) {
    pattern = replaceSymbols(pattern, genSymEnv)
    const zipper = new List(this.store)
    return matcher(pattern)([], {}, zipper)
  }
}

const genSymEnv = {
  get [Symbol.for('_')]() { return Symbol() }
}

const matcher = pattern =>
  compose(matchers(pattern), unique, fillBlanks(pattern))(push)

const txEnv = map => {
  const env = {}
  for (var key of map.keys()) {
    if (typeof key == 'symbol') env[key] = new Entity
  }
  return env
}

const interpret = (value, tx) => {
  if (tx instanceof List) {
    var fn = interpret[tx.value]
    return fn(value, tx.tail.value)
  }
  return tx
}

interpret[Symbol.for('merge')] = (map, tx) => {
  const copy = new Map(map)
  for (var [key,val] of tx) {
    copy.set(key, interpret(map.get(key), val))
  }
  return copy
}

const matchers = pattern => {
  var fn = matchers[type(pattern)] || matchers.value
  return fn(pattern)
}

matchers.value = pattern => conj => (accum, env, zip) =>
  pattern == zip.value ? conj(accum, env, zip) : accum

matchers.symbol = pattern => conj => (accum, env, zip) => {
  if (pattern in env) {
    return env[pattern] == zip.value
      ? conj(accum, env, zip)
      : accum
  }
  return conj(accum, assoc(pattern, zip.value, env), zip)
}

matchers.set = pattern =>
  collect(pattern.values()).map(pat => conj => (accum, env, zip) => {
    if (typeof pat != 'symbol') return accum
    if (pat in env) {
      var val = env[pat]
      if (zip.value.has(val)) return conj(accum, env, zip)
    } else {
      for (var val of zip.value.values()) {
        accum = conj(accum, assoc(pat, val, env), zip)
      }
    }
    return accum
  })

matchers.map = pattern =>
  collect(pattern.entries()).map(([patk,patv]) => {
    var fn = typeof patk == 'symbol'
      ? conj => (accum, env, zip) => {
        const value = zip.value
        if (patk in env) {
          var patkv = env[patk]
          return value.has(patkv)
            ? conj(accum, env, new List(value.get(patkv), zip))
            : accum
        }
        for (var [key,val] of value.entries()) {
          accum = conj(accum, assoc(patk, key, env), new List(val, zip))
        }
        return accum
      }
      : conj => (accum, env, zip) =>
        zip.value.has(patk)
          ? conj(accum, env, new List(zip.value.get(patk), zip))
          : accum
    return [fn, matchers(patv), up]
  })

const up = conj => (accum, env, zip) => conj(accum, env, zip.tail)

const collect = itr => {
  var out = []
  for (var v of itr) out.push(v)
  return out
}

const unique = conj => {
  const seen = []
  return (accum, env) => {
    if (seen.some(s => equal(s, env))) return accum
    seen.push(env)
    return conj(accum, env)
  }
}

const fillBlanks = pattern => map(env => replaceSymbols(pattern, env))

const push = (accum, value) => {
  accum.push(value)
  return accum
}

const assoc = (key, value, object) => {
  object = Object.create(object)
  object[key] = value
  return object
}

export {DB,Entity}
