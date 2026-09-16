import { useState, useEffect } from 'react';
import { Bell, Search, UserCircle, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Header() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="top-header">
      <div className="header-title">
        {t('header.title')}
      </div>
      <div className="header-actions">
        <button onClick={toggleLanguage} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '16px' }}>
          {i18n.language === 'en' ? 'A/अ' : 'अ/A'}
        </button>
        <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button onClick={() => alert("Search triggered")} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
          <Search size={20} />
        </button>
        <button onClick={() => alert("Notifications triggered")} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
          <Bell size={20} />
        </button>
        <div onClick={() => alert("Account settings triggered")} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer' }}>
          <UserCircle size={28} color="var(--text-secondary)" />
          <span>{t('header.gov_official')}</span>
        </div>
      </div>
    </header>
  );
}
