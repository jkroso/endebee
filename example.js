const {edn,write} = require('edn-js')
const {DB} = require('./')

const db = new DB

db.transact(edn`(merge {
  jake {"name" "Jake Rosoman"
        "follows" #{alan nikita harold gerald juan rich}}
  juan {"name" "Juan Benet"}
  rich {"name" "Rich Hickey"}
  alan {"name" "Alan Kay"}
  nikita {"name" "Nikita Prokopov" "follows" #{rich}}
  harold {"name" "Harold Abelson" "follows" #{gerald}}
  gerald {"name" "Gerald Jay Sussman" "follows" #{harold}}
})`)

const mutualAdmirers = db.query(edn`{
  a {"follows" #{b} "name" _}
  b {"follows" #{a} "name" _}
}`)

console.log(write(mutualAdmirers))
// => [{Entity(1) => {"follows" #{Entity(2)} "name" "Harold Abelson"}
//      Entity(2) => {"follows" #{Entity(1)} "name" "Gerald Jay Sussman"}}]
