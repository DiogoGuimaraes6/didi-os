import Link from 'next/link';
import { useRouter } from 'next/router';

interface SidebarProps {
  className?: string;
  taskCount?: number;
}

export default function Sidebar({ className = '', taskCount = 0 }: SidebarProps) {
  const router = useRouter();
  
  const isActive = (path: string) => {
    if (path === '/' && router.pathname === '/') return true;
    if (path !== '/' && router.pathname.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/tasks', label: 'Tasks', icon: '✅', badge: taskCount > 0 ? taskCount.toString() : undefined },
    { href: '/projects', label: 'Projects', icon: '📁' },
    { href: '/calendar', label: 'Calendar', icon: '📅' },
    { href: '/notes', label: 'Notes', icon: '📝' },
    { href: '/milestones', label: 'Milestones', icon: '🎯' },
  ];

  return (
    <div className={`sidebar ${className}`}>
      <div className="sidebar-header">
        <h2>Workspace</h2>
        <button className="sidebar-toggle">‹</button>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
            {item.badge && <span className="sidebar-badge">{item.badge}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
