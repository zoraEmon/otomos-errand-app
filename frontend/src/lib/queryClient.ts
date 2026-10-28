import { QueryClient } from '@tanstack/react-query'
import type { Persister } from '@tanstack/query-persist-client-core'

const CACHE_DATABASE = 'otomos-tanstack-query'
const CACHE_STORE = 'query-cache'
const CACHE_KEY = 'persisted-query-client'

function openCacheDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DATABASE, 1)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(CACHE_STORE)) {
        database.createObjectStore(CACHE_STORE)
      }
    }

    request.onerror = () => reject(request.error ?? new Error('Unable to open query cache database.'))
    request.onsuccess = () => resolve(request.result)
  })
}

async function readFromIndexedDb<T>(key: string): Promise<T | undefined> {
  const database = await openCacheDatabase()
  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = database.transaction(CACHE_STORE, 'readonly')
    const request = transaction.objectStore(CACHE_STORE).get(key)

    request.onerror = () => {
      database.close()
      reject(request.error ?? new Error('Unable to read query cache item.'))
    }

    request.onsuccess = () => {
      database.close()
      resolve(request.result as T | undefined)
    }
  })
}

async function writeToIndexedDb<T>(key: string, value: T): Promise<void> {
  const database = await openCacheDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CACHE_STORE, 'readwrite')
    const request = transaction.objectStore(CACHE_STORE).put(value, key)

    request.onerror = () => {
      database.close()
      reject(request.error ?? new Error('Unable to write query cache item.'))
    }

    request.onsuccess = () => {
      database.close()
      resolve()
    }
  })
}

async function removeFromIndexedDb(key: string): Promise<void> {
  const database = await openCacheDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CACHE_STORE, 'readwrite')
    const request = transaction.objectStore(CACHE_STORE).delete(key)

    request.onerror = () => {
      database.close()
      reject(request.error ?? new Error('Unable to remove query cache item.'))
    }

    request.onsuccess = () => {
      database.close()
      resolve()
    }
  })
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
})

export const persister: Persister = {
  async persistClient(persistedClient) {
    await writeToIndexedDb(CACHE_KEY, persistedClient)
  },

  async restoreClient() {
    return readFromIndexedDb(CACHE_KEY)
  },

  async removeClient() {
    await removeFromIndexedDb(CACHE_KEY)
  },
}
