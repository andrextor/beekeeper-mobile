import { type Mode, singleFlight } from './engine'

function controlledRun() {
  const calls: Mode[] = []
  let finish: () => void = () => {}
  const run = jest.fn(
    (mode: Mode) =>
      new Promise<void>((resolve) => {
        calls.push(mode)
        finish = resolve
      }),
  )
  return { calls, run, finish: () => finish() }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('singleFlight', () => {
  it('folds every request made during a run into one more run, full if any asked for it', async () => {
    const { calls, run, finish } = controlledRun()
    const request = singleFlight(run)
    const done = request('push')
    void request('push')
    void request('full')
    void request('push')
    finish()
    await flush()
    finish()
    await done
    expect(calls).toEqual(['push', 'full'])
  })

  it('stops when nobody asks again', async () => {
    const { calls, run, finish } = controlledRun()
    const request = singleFlight(run)
    const done = request('full')
    finish()
    await done
    await flush()
    expect(calls).toEqual(['full'])
  })

  it('keeps working after a run fails', async () => {
    const run = jest.fn(async (_mode: Mode) => {})
    run.mockRejectedValueOnce(new Error('sin señal'))
    const request = singleFlight(run)
    await request('full')
    await request('push')
    expect(run.mock.calls).toEqual([['full'], ['push']])
  })
})
