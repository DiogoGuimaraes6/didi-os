import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function Milestones() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

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

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const upcomingTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) > new Date());

  return (
    <div className="dashboard-layout">
      <Sidebar taskCount={todoTasks.length} />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Milestones</h1>
          <button className="btn-primary">Add Milestone</button>
        </div>
        
        <p className="muted">Track project progress and important deadlines across all your work.</p>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Project Progress</h2>
            {projects.length === 0 ? (
              <p className="muted">No projects yet. <a href="/projects">Create your first project</a></p>
            ) : (
              projects.map(project => {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const completedTasks = projectTasks.filter(t => t.status === 'done');
                const progress = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0;
                
                return (
                  <div key={project.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{project.name}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.3s' }}></div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {completedTasks.length} of {projectTasks.length} tasks completed
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="dashboard-card">
            <h2>Upcoming Deadlines</h2>
            {upcomingTasks.length === 0 ? (
              <p className="muted">No upcoming deadlines. <a href="/tasks">Set due dates for your tasks</a></p>
            ) : (
              upcomingTasks.slice(0, 5).map(task => (
                <div key={task.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 500 }}>{task.title}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-card" style={{ marginTop: '1.5rem' }}>
          <h2>Coming Soon</h2>
          <ul style={{ paddingLeft: '1.5rem', color: '#6b7280' }}>
            <li>Custom milestone creation and tracking</li>
            <li>Gantt chart view for project timelines</li>
            <li>Deadline notifications and reminders</li>
            <li>Team milestone collaboration</li>
            <li>Progress reporting and analytics</li>
            <li>Integration with calendar events</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
