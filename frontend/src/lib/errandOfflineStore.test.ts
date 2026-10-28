import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ErrandDTO } from '../../../shared/contracts/errand.contract'
import {
  getCachedErrand,
  getPendingMutations,
  removePendingMutation,
  saveCachedErrand,
  savePendingMutation,
} from './errandOfflineStore'

const errand: ErrandDTO = {
  id: 'errand-1',
  commanderId: 'commander-1',
  runnerId: 'runner-1',
  status: 'active',
  instructions: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [{
    id: 'item-1',
    errandId: 'errand-1',
    itemName: 'Milk',
    quantity: 1,
    isBought: false,
  }],
}

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('otomos-offline')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
})

describe('errand offline store', () => {
  it('persists an active errand for offline reads', async () => {
    await saveCachedErrand(errand)

    await expect(getCachedErrand(errand.id)).resolves.toEqual(errand)
  })

  it('queues the latest item state once and removes it after sync', async () => {
    await savePendingMutation(errand.id, 'item-1', true)
    await savePendingMutation(errand.id, 'item-1', false)

    const queued = await getPendingMutations(errand.id)
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      id: 'errand-1:item-1',
      isBought: false,
    })

    await removePendingMutation(queued[0].id)
    await expect(getPendingMutations(errand.id)).resolves.toEqual([])
  })
})
