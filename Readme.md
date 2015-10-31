# Endebee

A database with structural symmetry between data, queries, and transactions. Instead of some special query syntax you just hand it a data structure and it fills in the blanks with real data. It works a bit like a descructuring assignment except it handles ambiguity by returning all possible results. And it will be able to handle predicates like `{person {"age" (> 21)}}`

Also transactions and queries are data. This enables a bunch of non-obvious things:

- Easier to generate them programmatically
- They can be merged on the client before sending them
- Efficient replication since to stay up to date a peer only needs to subscribe to the transaction stream of   another
- Transactions can be grouped while they wait to be applied
- Makes it possible to generate the reverse of a transaction
- GUI clients can be smarter about updating themselves; since data and transactions use the same structure we can easily tell if a transaction will affect the result of a query

Further design thoughts can be found in the [wiki](//www.notion.so/LT2Fafkqw4tEQ). Feel free to contribute ideas or ask questions there too.

## Installation

`npm install endebee`

then in your app:

```js
const {DB} = require('endebee')
```

## API

First we create an new database. For now there is only an in memory implementation so there is no need to pass a path in

```js
const db = new DB
```

Then we add your initial data set with a transaction. `db` is conceptually a `Map` of entities to values so to add data we use a `merge` expression. Any symbols in the transaction refer to the same thing no matter where they are used. So they are dataflow variables. And if an undefined symbol is used where an Entity is expected then a new Entity is automatically created. Check out the syntax this enables:

```js
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
```

Now we can ask questions. Note that the `_` symbol is shorthand for `${Symbol()}` so we aren't asking for both `a` and `b` to have the same name. Use `_` when you want to extract a value but you don't feel like giving it a name.

```js
const mutualAdmirers = db.query(edn`{
  a {"follows" #{b} "name" _}
  b {"follows" #{a} "name" _}
}`)
mutualAdmirers[0] // => {Entity(1) => {"follows" #{Entity(2)} "name" "Harold Abelson"}
                  //     Entity(2) => {"follows" #{Entity(1)} "name" "Gerald Jay Sussman"}}
```
