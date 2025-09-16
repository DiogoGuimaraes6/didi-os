import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@libsql/client';

type Project = {
  id?: number;
  name: string;
  description?: string;
  status?: 'Upcoming'|'In Progress'|'Completed'|'On Hold';
  createdAt?: string;
};

const useTurso = !!process.env.TURSO_DATABASE_URL;

import fs from 'fs';
import path from 'path';

// Enhanced storage with file persistence (dev only)
class ProjectMemoryStore {
  private data: Project[] = [];
  private nextId: number = 1;
  private filePath: string;

  constructor() {
    // Use a file in the project directory for dev persistence
    this.filePath = path.join(process.cwd(), '.dev-projects.json');
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
      console.log('No existing project data found, starting fresh');
      this.data = [];
      this.nextId = 1;
    }
  }

  getData() {
    return this.data.slice().reverse();
  }

  addProject(project: Project) {
    const newProject = {
      ...project,
      id: this.nextId++,
      createdAt: new Date().toISOString()
    };
    this.data.push(newProject);
    this.save();
    return newProject;
  }

  updateProject(id: number, updates: Partial<Project>) {
    const index = this.data.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data[index] = { ...this.data[index], ...updates };
    this.save();
    return this.data[index];
  }

  deleteProject(id: number) {
    const index = this.data.findIndex(p => p.id === id);
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
      console.error('Failed to save projects to file:', error);
    }
  }
}

const mem = new ProjectMemoryStore();

async function ensureSchema(client: ReturnType<typeof createClient>) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Upcoming',
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
      const rows = (await client.execute('SELECT * FROM projects ORDER BY createdAt DESC')).rows;
      return res.json(rows);
    }
    if (req.method === 'POST') {
      const body = req.body as Project;
      const r = await client.execute({
        sql: `INSERT INTO projects (name, description, status) VALUES (?, ?, ?)`,
        args: [body.name, body.description ?? '', body.status ?? 'Upcoming']
      });
      const id = Number(r.lastInsertRowid);
      const row = (await client.execute({ sql: 'SELECT * FROM projects WHERE id=?', args: [id] })).rows[0];
      return res.status(201).json(row);
    }
    if (req.method === 'PATCH') {
      const id = Number(req.query.id);
      const body = req.body as Project;
      await client.execute({
        sql: `UPDATE projects SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                status = COALESCE(?, status)
              WHERE id = ?`,
        args: [body.name || null, body.description || null, body.status || null, id]
      });
      const row = (await client.execute({ sql: 'SELECT * FROM projects WHERE id=?', args: [id] })).rows[0];
      return res.json(row);
    }
    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      await client.execute({ sql: 'DELETE FROM projects WHERE id=?', args: [id] });
      return res.status(204).end();
    }

    return res.status(405).end();
  } else {
    // In-memory dev mode with persistence
    if (req.method === 'GET') {
      return res.json(mem.getData());
    }
    if (req.method === 'POST') {
      const body = req.body as Project;
      const project = {
        name: body.name,
        description: body.description ?? '',
        status: body.status ?? 'Upcoming'
      };
      const newProject = mem.addProject(project);
      return res.status(201).json(newProject);
    }
    if (req.method === 'PATCH') {
      const id = Number(req.query.id);
      const body = req.body as Project;
      const updatedProject = mem.updateProject(id, body);
      if (!updatedProject) return res.status(404).end();
      return res.json(updatedProject);
    }
    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      const success = mem.deleteProject(id);
      if (!success) return res.status(404).end();
      return res.status(204).end();
    }
    return res.status(405).end();
  }
}
