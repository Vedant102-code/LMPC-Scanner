import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, ShieldAlert, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Sidebar() {
  const { t } = useTranslation();

  const navItems = [
    { name: t('sidebar.dashboard'), path: '/', icon: <LayoutDashboard size={20} /> },
    { name: t('sidebar.inspections'), path: '/inspections', icon: <FileText size={20} /> },
    { name: t('sidebar.officers'), path: '/officers', icon: <Users size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <ShieldAlert size={24} color="var(--accent-color)" />
          LMPC Compliance
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
