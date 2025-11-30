import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface UltraTablesDB extends DBSchema {
  records: {
    key: string
    value: {
      id: string
      tableId: string
      data: any
      updatedAt: string
    }
    indexes: {
      'by-table': string
      'by-updated': string
    }
  }
  tables: {
    key: string
    value: {
      id: string
      name: string
      columns: any[]
      views: any[]
      updatedAt: string
    }
  }
}

class UltraTablesCache {
  private db: IDBPDatabase<UltraTablesDB> | null = null
  private initPromise: Promise<IDBPDatabase<UltraTablesDB>> | null = null

  async init(): Promise<IDBPDatabase<UltraTablesDB>> {
    if (this.db) return this.db

    // Prevent multiple simultaneous initializations
    if (this.initPromise) return this.initPromise

    this.initPromise = openDB<UltraTablesDB>('ultra-tables-cache', 1, {
      upgrade(db) {
        // Records store
        if (!db.objectStoreNames.contains('records')) {
          const recordsStore = db.createObjectStore('records', { keyPath: 'id' })
          recordsStore.createIndex('by-table', 'tableId')
          recordsStore.createIndex('by-updated', 'updatedAt')
        }

        // Tables store
        if (!db.objectStoreNames.contains('tables')) {
          db.createObjectStore('tables', { keyPath: 'id' })
        }
      },
    })

    this.db = await this.initPromise
    return this.db
  }

  async cacheRecords(tableId: string, records: any[]): Promise<void> {
    const db = await this.init()
    const tx = db.transaction('records', 'readwrite')

    await Promise.all(
      records.map((record) =>
        tx.store.put({
          id: record.id,
          tableId,
          data: record.data,
          updatedAt: record.updated_at,
        })
      )
    )

    await tx.done
  }

  async getRecords(tableId: string): Promise<any[]> {
    const db = await this.init()
    return db.getAllFromIndex('records', 'by-table', tableId)
  }

  async cacheTable(table: any): Promise<void> {
    const db = await this.init()
    await db.put('tables', {
      id: table.id,
      name: table.name,
      columns: table.columns,
      views: table.views,
      updatedAt: table.updated_at,
    })
  }

  async getTable(tableId: string): Promise<any> {
    const db = await this.init()
    return db.get('tables', tableId)
  }

  async clearTable(tableId: string): Promise<void> {
    const db = await this.init()
    const tx = db.transaction('records', 'readwrite')
    const index = tx.store.index('by-table')

    for await (const cursor of index.iterate(tableId)) {
      cursor.delete()
    }

    await tx.done
  }

  async updateRecord(recordId: string, tableId: string, data: any): Promise<void> {
    const db = await this.init()
    await db.put('records', {
      id: recordId,
      tableId,
      data,
      updatedAt: new Date().toISOString(),
    })
  }

  async deleteRecord(recordId: string): Promise<void> {
    const db = await this.init()
    await db.delete('records', recordId)
  }

  async clearAll(): Promise<void> {
    const db = await this.init()
    await db.clear('records')
    await db.clear('tables')
  }
}

export const ultraTablesCache = new UltraTablesCache()
