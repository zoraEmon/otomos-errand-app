import type { ErrandDTO } from '../../../shared/contracts/errand.contract'

type PendingMutation = {
  id: string
  errandId: string
  itemId: string
  isBought: boolean
  updatedAt: number
}

const DATABASE_NAME = 'otomos-offline'
const DATABASE_VERSION = 1
const ERRANDS_STORE = 'errands'
const MUTATIONS_STORE = 'item-mutations'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onerror = () => reject(request.error ?? new Error('Unable to open offline storage.'))
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(ERRANDS_STORE)) {
        database.createObjectStore(ERRANDS_STORE, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(MUTATIONS_STORE)) {
        database.createObjectStore(MUTATIONS_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function transaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = operation(database.transaction(storeName, mode).objectStore(storeName))
    request.onerror = () => reject(request.error ?? new Error('Offline storage operation failed.'))
    request.onsuccess = () => {
      database.close()
      resolve(request.result)
    }
  })
}

export async function getCachedErrand(errandId: string): Promise<ErrandDTO | undefined> {
  return transaction<ErrandDTO | undefined>(ERRANDS_STORE, 'readonly', (store) => store.get(errandId))
}

export async function saveCachedErrand(errand: ErrandDTO): Promise<void> {
  await transaction(ERRANDS_STORE, 'readwrite', (store) => store.put(errand))
}

export async function getPendingMutations(errandId?: string): Promise<PendingMutation[]> {
  const mutations = await transaction<PendingMutation[]>(MUTATIONS_STORE, 'readonly', (store) => store.getAll())
  return mutations
    .filter((mutation) => !errandId || mutation.errandId === errandId)
    .sort((left, right) => left.updatedAt - right.updatedAt)
}

export async function savePendingMutation(errandId: string, itemId: string, isBought: boolean): Promise<void> {
  await transaction(MUTATIONS_STORE, 'readwrite', (store) => store.put({
    id: `${errandId}:${itemId}`,
    errandId,
    itemId,
    isBought,
    updatedAt: Date.now(),
  }))
}

export async function removePendingMutation(id: string): Promise<void> {
  await transaction(MUTATIONS_STORE, 'readwrite', (store) => store.delete(id))
}
