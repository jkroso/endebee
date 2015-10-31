const {deepEqual} = require('assert')
const {read,edn} = require('edn-js')
const {DB} = require('..')

const db = new DB

it('basics', () => {
  db.transact(edn`(merge {x {"name" "Artisanopolis"}})`)
  const entity = db.query(edn`{entity {"name" "Artisanopolis"}}`)[0].keys().next().value
  deepEqual(db.get(entity), read(`{"name" "Artisanopolis"}`))
  db.transact(edn`(merge {${entity} (merge {"name" "Tomorrowland"})})`)
  deepEqual(db.get(entity), read(`{"name" "Tomorrowland"}`))
})
