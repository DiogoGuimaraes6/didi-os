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

export default function Calendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getProjectName = (projectId?: number) => {
    if (!projectId) return '';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : '';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getTasksForDate = (day: number | null) => {
    if (!day) return [];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    
    return tasks.filter(task => 
      task.dueDate && task.dueDate.startsWith(dateStr)
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);
  const todoTasks = tasks.filter(t => t.status === 'todo');

  return (
    <div className="dashboard-layout">
      <Sidebar taskCount={todoTasks.length} />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Calendar</h1>
          <button className="btn-primary">Add Event</button>
        </div>
        
        <p className="muted">View your tasks organized by due dates in a monthly calendar view.</p>

      <div className="card" style={{padding: '1.5rem'}}>
        <div className="row" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <button className="btn" onClick={previousMonth}>← Previous</button>
          <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button className="btn" onClick={nextMonth}>Next →</button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          backgroundColor: '#e5e7eb',
          border: '1px solid #e5e7eb'
        }}>
          {weekDays.map(day => (
            <div key={day} style={{
              padding: '0.5rem',
              backgroundColor: '#f9fafb',
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '0.875rem'
            }}>
              {day}
            </div>
          ))}
          
          {days.map((day, index) => {
            const tasksForDay = getTasksForDate(day);
            return (
              <div
                key={index}
                style={{
                  minHeight: '80px',
                  padding: '0.5rem',
                  backgroundColor: day ? '#ffffff' : '#f9fafb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                {day && (
                  <>
                    <div style={{fontSize: '0.875rem', fontWeight: 'bold'}}>
                      {day}
                    </div>
                    {tasksForDay.map(task => (
                      <div
                        key={task.id}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem',
                          backgroundColor: task.status === 'done' ? '#d1fae5' : '#dbeafe',
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: task.status === 'done' ? '#10b981' : '#3b82f6',
                          cursor: 'pointer'
                        }}
                        title={`${task.title}${getProjectName(task.projectId) ? ` (${getProjectName(task.projectId)})` : ''}`}
                      >
                        <div style={{fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                          {task.title}
                        </div>
                        {getProjectName(task.projectId) && (
                          <div style={{opacity: 0.7, fontSize: '0.6rem'}}>
                            {getProjectName(task.projectId)}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{marginTop: '1rem'}}>
        <h3>Legend</h3>
        <div className="row" style={{gap: '1rem'}}>
          <div className="row" style={{alignItems: 'center', gap: '0.5rem'}}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#dbeafe',
              border: '1px solid #3b82f6',
              borderRadius: '4px'
            }}></div>
            <span style={{fontSize: '0.875rem'}}>Todo Tasks</span>
          </div>
          <div className="row" style={{alignItems: 'center', gap: '0.5rem'}}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '4px'
            }}></div>
            <span style={{fontSize: '0.875rem'}}>Completed Tasks</span>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
