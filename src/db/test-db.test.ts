import { openTestDb } from './test-db'

describe('test database', () => {
  it('runs SQL with positional parameters', async () => {
    const db = openTestDb()
    await db.execAsync('create table t (id text primary key, n integer)')
    expect(await db.runAsync('insert into t values (?, ?)', ['a', 1])).toEqual({ changes: 1 })
    expect(await db.getFirstAsync('select * from t where id = ?', ['a'])).toEqual({ id: 'a', n: 1 })
    expect(await db.getFirstAsync('select * from t where id = ?', ['b'])).toBeNull()
  })

  it('rolls a failed transaction back', async () => {
    const db = openTestDb()
    await db.execAsync('create table t (id text primary key)')
    await expect(
      db.transaction(async () => {
        await db.runAsync('insert into t values (?)', ['a'])
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')
    expect(await db.getAllAsync('select * from t')).toEqual([])
  })

  it('queues transactions instead of nesting them', async () => {
    const db = openTestDb()
    await db.execAsync('create table t (n integer)')
    await Promise.all(
      [1, 2, 3].map((n) =>
        db.transaction(async () => {
          await db.runAsync('insert into t values (?)', [n])
        }),
      ),
    )
    expect(await db.getAllAsync('select n from t order by n')).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }])
  })
})
