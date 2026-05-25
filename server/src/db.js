import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'db.json');

const initialData = {
  users: [],
  expenses: []
};

// Good enough for a local class project. Swap this file out for a real DB later.
async function ensureDb() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2));
  }
}

export async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(raw);
}

export async function writeDb(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}
