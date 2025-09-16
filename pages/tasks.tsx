import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';

type Task = {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  projectId?: number;
  createdAt: string;
};

type Project = {
  id: number;
  name: string;
  description?: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'On Hold';
  createdAt: string;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');

  const load = async () => {
    const r = await fetch('/api/tasks');
    setTasks(await r.json());
  };

  const loadProjects = async () => {
    const r = await fetch('/api/projects');
    setProjects(await r.json());
  };

  useEffect(() => { 
    load(); 
    loadProjects();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        description, 
        priority, 
        status: 'todo',
        projectId: projectId || undefined,
        dueDate: dueDate || undefined
      })
    });
    if (r.ok) {
      setTitle(''); setDescription(''); setPriority('medium'); setProjectId(''); setDueDate('');
      load();
    }
  };

  const toggle = async (t: Task) => {
    await fetch('/api/tasks?id=' + t.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: t.status === 'todo' ? 'done' : 'todo' })
    });
    load();
  };

  const remove = async (id: number) => {
    await fetch('/api/tasks?id=' + id, { method: 'DELETE' });
    load();
  };

  const getProjectName = (projectId?: number) => {
    if (!projectId) return '—';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : '—';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar taskCount={tasks.length} />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Tasks</h1>
          <button className="btn-primary">Add Task</button>
        </div>
        
        <p className="muted">Create and manage your tasks with priorities, due dates, and project assignments.</p>

      <form onSubmit={add} className="card grid" style={{marginTop: '1rem'}}>
        <input placeholder="Task title" value={title} onChange={e=>setTitle(e.target.value)} required />
        <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
        <input 
          type="date" 
          placeholder="Due date" 
          value={dueDate} 
          onChange={e=>setDueDate(e.target.value)} 
        />
        <div className="row">
          <select value={priority} onChange={e=>setPriority(e.target.value as any)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select value={projectId} onChange={e=>setProjectId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">No Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn" type="submit">Add Task</button>
        </div>
      </form>

      <div className="grid" style={{marginTop: '1rem'}}>
        {tasks.map(t => (
          <div className="card" key={t.id}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <div>
                <strong>{t.title}</strong>
                {' '}
                <span className="tag">{t.priority}</span>
                {' '}
                <span className="tag" style={{backgroundColor: '#e5e7eb', color: '#374151'}}>
                  {getProjectName(t.projectId)}
                </span>
              </div>
              <div className="row">
                <button className="btn" onClick={()=>toggle(t)}>{t.status === 'todo' ? 'Mark Done' : 'Mark Todo'}</button>
                <button className="btn" onClick={()=>remove(t.id)}>Delete</button>
              </div>
            </div>
            {t.description && <p className="muted">{t.description}</p>}
            <div className="muted">
              Created: {new Date(t.createdAt).toLocaleString()}
              {t.dueDate && (
                <> • Due: {new Date(t.dueDate).toLocaleDateString()}</>
              )}
            </div>
          </div>
        ))}
      </div>
      </main>
    </div>
  );
}
