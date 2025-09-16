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

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('Today');
  const [contextMenu, setContextMenu] = useState<{task: Task, x: number, y: number} | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'done',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    projectId: undefined as number | undefined
  });

  const loadTasks = async () => {
    try {
      const r = await fetch('/api/tasks');
      setTasks(await r.json());
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const r = await fetch('/api/projects');
      setProjects(await r.json());
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      projectId: task.projectId
    });
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setEditForm({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      projectId: undefined
    });
  };

  const updateTask = async () => {
    if (!editingTask) return;
    
    try {
      const response = await fetch(`/api/tasks?id=${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        await loadTasks(); // Refresh tasks
        closeEditModal();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setContextMenu({
      task,
      x: e.clientX,
      y: e.clientY
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const markAsDone = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks?id=${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' })
      });
      
      if (response.ok) {
        await loadTasks();
        closeContextMenu();
      }
    } catch (error) {
      console.error('Failed to mark task as done:', error);
    }
  };

  const postponeTask = async (task: Task) => {
    const today = new Date();
    let nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    
    // If next day is weekend (Saturday = 6, Sunday = 0), move to next Monday
    if (nextDay.getDay() === 0) { // Sunday
      nextDay.setDate(nextDay.getDate() + 1); // Monday
    } else if (nextDay.getDay() === 6) { // Saturday
      nextDay.setDate(nextDay.getDate() + 2); // Monday
    }
    
    const newDueDate = nextDay.toISOString().split('T')[0];
    
    try {
      const response = await fetch(`/api/tasks?id=${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDueDate })
      });
      
      if (response.ok) {
        await loadTasks();
        closeContextMenu();
      }
    } catch (error) {
      console.error('Failed to postpone task:', error);
    }
  };

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  const getProjectName = (projectId?: number) => {
    if (!projectId) return 'No project';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'No project';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return '#6b7280';
      case 'In Progress': return '#3b82f6';
      case 'Completed': return '#10b981';
      case 'On Hold': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Filter tasks for different views
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const todayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.dueDate.startsWith(today);
  });

  // Filter tasks based on active filter
  const getFilteredTasks = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() + 1);

    switch (activeFilter) {
      case 'Today':
        return tasks.filter(t => {
          if (t.status === 'done') return false; // Hide done tasks
          if (!t.dueDate) return false;
          const taskDate = new Date(t.dueDate);
          return taskDate.toDateString() === today.toDateString();
        });
      
      case 'Tomorrow':
        return tasks.filter(t => {
          if (t.status === 'done') return false; // Hide done tasks
          if (!t.dueDate) return false;
          const taskDate = new Date(t.dueDate);
          return taskDate.toDateString() === tomorrow.toDateString();
        });
      
      case 'Next Week':
        return tasks.filter(t => {
          if (t.status === 'done') return false; // Hide done tasks
          if (!t.dueDate) return false;
          const taskDate = new Date(t.dueDate);
          return taskDate >= today && taskDate <= nextWeek;
        });
      
      case 'This Month':
        return tasks.filter(t => {
          if (t.status === 'done') return false; // Hide done tasks
          if (!t.dueDate) return false;
          const taskDate = new Date(t.dueDate);
          return taskDate >= today && taskDate <= thisMonth;
        });
      
      case 'Done':
        return tasks.filter(t => t.status === 'done');
      
      case 'All':
      default:
        return tasks.filter(t => t.status !== 'done'); // Hide done tasks from All view
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="dashboard-layout">
      <Sidebar taskCount={todoTasks.length} />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Home</h1>
          <div className="header-actions">
            <button 
              className="btn-secondary"
              onClick={() => {
                // Trigger the keyboard shortcut programmatically
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true
                });
                window.dispatchEvent(event);
              }}
            >
              <span>Quick Task</span>
              <kbd>⌘K</kbd>
            </button>
            <button className="btn-primary">New Project</button>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Projects Overview */}
          <section className="dashboard-card projects-overview">
            <h2>Projects</h2>
            <div className="projects-grid">
              {projects.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-card">
                    <div className="empty-text">No cover</div>
                  </div>
                </div>
              ) : (
                projects.slice(0, 3).map(project => (
                  <div key={project.id} className="project-card">
                    <div className="project-cover">No cover</div>
                    <h3>{project.name}</h3>
                    <div className="project-meta">
                      <div className="task-count">
                        {tasks.filter(t => t.projectId === project.id).length} tasks
                      </div>
                      <div className="next-milestone">
                        Next Milestone: 
                        <div className="milestone-info">
                          {project.description || project.name}
                        </div>
                        <div className="due-date">Due: {new Date(project.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Inbox */}
          <section className="dashboard-card inbox">
            <h2>Inbox</h2>
            <div className="inbox-filters">
              <button 
                className={`filter-btn ${activeFilter === 'All' ? 'active' : ''}`}
                onClick={() => setActiveFilter('All')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${activeFilter === 'Today' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Today')}
              >
                Today
              </button>
              <button 
                className={`filter-btn ${activeFilter === 'Tomorrow' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Tomorrow')}
              >
                Tomorrow
              </button>
              <button 
                className={`filter-btn ${activeFilter === 'Next Week' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Next Week')}
              >
                Next Week
              </button>
              <button 
                className={`filter-btn ${activeFilter === 'This Month' ? 'active' : ''}`}
                onClick={() => setActiveFilter('This Month')}
              >
                This Month
              </button>
              <button 
                className={`filter-btn ${activeFilter === 'Done' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Done')}
              >
                Done
              </button>
            </div>
            
            <div className="inbox-table">
              <div className="table-header">
                <div className="col-task">TASK ↑</div>
                <div className="col-project">PROJECT ↓</div>
                <div className="col-status">STATUS ↓</div>
                <div className="col-priority">PRIORITY ↑</div>
                <div className="col-due">DUE DATE ↓</div>
                <div className="col-created">CREATED ↑</div>
              </div>
              
              {filteredTasks.slice(0, 10).map(task => (
                <div 
                  key={task.id} 
                  className="table-row clickable" 
                  onClick={() => openEditModal(task)}
                  onContextMenu={(e) => handleContextMenu(e, task)}
                >
                  <div className="col-task">{task.title}</div>
                  <div className="col-project">{getProjectName(task.projectId)}</div>
                  <div className="col-status">
                    <span className={`status-badge ${task.status}`}>{task.status}</span>
                  </div>
                  <div className="col-priority">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div className="col-due">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                  </div>
                  <div className="col-created">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {filteredTasks.length === 0 && (
                <div className="empty-inbox">
                  <p>
                    {activeFilter === 'All' 
                      ? 'No tasks found. ' 
                      : `No tasks for ${activeFilter.toLowerCase()}. `
                    }
                    <a href="/tasks">Create your first task</a>
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* Context Menu */}
      {contextMenu && (
        <div className="context-menu-overlay" onClick={closeContextMenu}>
          <div 
            className="context-menu"
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="context-menu-item"
              onClick={() => markAsDone(contextMenu.task)}
            >
              ✅ Done
            </button>
            <button 
              className="context-menu-item"
              onClick={() => postponeTask(contextMenu.task)}
            >
              ⏰ Postpone
            </button>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Task</h2>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>
            
            <form className="modal-form" onSubmit={e => { e.preventDefault(); updateTask(); }}>
              <div className="modal-row">
                <label>
                  Title *
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    required
                  />
                </label>
              </div>
              
              <div className="modal-row">
                <label>
                  Description
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    placeholder="Task description"
                    rows={3}
                  />
                </label>
              </div>
              
              <div className="modal-row">
                <label>
                  Project
                  <select
                    value={editForm.projectId || ''}
                    onChange={e => setEditForm({...editForm, projectId: e.target.value ? Number(e.target.value) : undefined})}
                  >
                    <option value="">No project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </label>
                
                <label>
                  Status
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({...editForm, status: e.target.value as 'todo' | 'done'})}
                  >
                    <option value="todo">To Do</option>
                    <option value="done">Done</option>
                  </select>
                </label>
              </div>
              
              <div className="modal-row">
                <label>
                  Priority
                  <select
                    value={editForm.priority}
                    onChange={e => setEditForm({...editForm, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                
                <label>
                  Due Date
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={e => setEditForm({...editForm, dueDate: e.target.value})}
                  />
                </label>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}