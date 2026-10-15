import { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'gastos.db';

export async function initDatabase(db: SQLiteDatabase): Promise<void> {

    await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY NOT NULL, --el mismo id string que ya usaba la app
            amount REAL NOT NULL,   -- REAL=número con decimales
            category TEXT NOT NULL, 
            date TEXT NOT NULL,   -- fecha en formato ISO 8601
            description TEXT    -- puede ser NULL porque es opcional
        );
    `);
}