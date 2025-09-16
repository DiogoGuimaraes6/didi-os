import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@libsql/client';

type Task = {
  id?: number;
  title: string;
  description?: string;
  status?: 'todo'|'done';
  priority?: 'low'|'medium'|'high';
  dueDate?: string;
  projectId?: number;
  createdAt?: string;
};

// Choose DB: remote Turso (if URL present), otherwise use a simple JSON in-memory store
const useTurso = !!process.env.TURSO_DATABASE_URL;

import fs from 'fs';
import path from 'path';

// Enhanced storage with file persistence (dev only)
class MemoryStore {
  private data: Task[] = [];
  private nextId: number = 1;
  private filePath: string;

  constructor() {
    // Use a file in the project directory for dev persistence
    this.filePath = path.join(process.cwd(), '.dev-tasks.json');
    this.loadFromFile();
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileData = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(fileData);
        this.data = parsed.data || [];
        this.nextId = parsed.nextId || 1;
      }
    } catch (error) {
      console.log('No existing task data found, starting fresh');
      this.data = [];
      this.nextId = 1;
    }
  }

  getData() {
    return this.data.slice().reverse();
  }

  addTask(task: Task) {
    const newTask = {
      ...task,
      id: this.nextId++,
      createdAt: new Date().toISOString()
    };
    this.data.push(newTask);
    this.save();
    return newTask;
  }

  updateTask(id: number, updates: Partial<Task>) {
    const index = this.data.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.data[index] = { ...this.data[index], ...updates };
    this.save();
    return this.data[index];
  }

  deleteTask(id: number) {
    const index = this.data.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.data.splice(index, 1);
    this.save();
    return true;
  }

  private save() {
    try {
      // Save to file for true persistence across restarts
      const dataToSave = {
        data: this.data,
        nextId: this.nextId,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error('Failed to save tasks to file:', error);
    }
  }
}

const mem = new MemoryStore();

async function ensureSchema(client: ReturnType<typeof createClient>) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      dueDate TEXT,
      projectId INTEGER,
      createdAt TEXT DEFAULT (datetime('now'))
    );
  `);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (useTurso) {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL as string,
      authToken: process.env.TURSO_AUTH_TOKEN as string,
    });
    await ensureSchema(client);

    if (req.method === 'GET') {
      const rows = (await client.execute('SELECT * FROM tasks ORDER BY createdAt DESC')).rows;
      return res.json(rows);
    }
    if (req.method === 'POST') {
      const body = req.body as Task;
      const r = await client.execute({
        sql: `INSERT INTO tasks (title, description, status, priority, dueDate, projectId) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [body.title, body.description ?? '', body.status ?? 'todo', body.priority ?? 'medium', body.dueDate ?? null, body.projectId ?? null]
      });
      const id = Number(r.lastInsertRowid);
      const row = (await client.execute({ sql: 'SELECT * FROM tasks WHERE id=?', args: [id] })).rows[0];
      return res.status(201).json(row);
    }
    if (req.method === 'PATCH') {
      const id = Number(req.query.id);
      const body = req.body as Task;
      await client.execute({
        sql: `UPDATE tasks SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                status = COALESCE(?, status),
                priority = COALESCE(?, priority),
                dueDate = COALESCE(?, dueDate),
                projectId = COALESCE(?, projectId)
              WHERE id = ?`,
        args: [body.title || null, body.description || null, body.status || null, body.priority || null, body.dueDate || null, body.projectId || null, id]
      });
      const row = (await client.execute({ sql: 'SELECT * FROM tasks WHERE id=?', args: [id] })).rows[0];
      return res.json(row);
    }
    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      await client.execute({ sql: 'DELETE FROM tasks WHERE id=?', args: [id] });
      return res.status(204).end();
    }

    return res.status(405).end();
  } else {
    // In-memory dev mode with persistence
    if (req.method === 'GET') {
      return res.json(mem.getData());
    }
    if (req.method === 'POST') {
      const body = req.body as Task;
      const task = {
        title: body.title,
        description: body.description ?? '',
        status: body.status ?? 'todo',
        priority: body.priority ?? 'medium',
        projectId: body.projectId,
        dueDate: body.dueDate
      };
      const newTask = mem.addTask(task);
      return res.status(201).json(newTask);
    }
    if (req.method === 'PATCH') {
      const id = Number(req.query.id);
      const body = req.body as Task;
      const updatedTask = mem.updateTask(id, body);
      if (!updatedTask) return res.status(404).end();
      return res.json(updatedTask);
    }
    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      const success = mem.deleteTask(id);
      if (!success) return res.status(404).end();
      return res.status(204).end();
    }
    return res.status(405).end();
  }
}
