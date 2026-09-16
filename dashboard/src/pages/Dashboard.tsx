import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';
import { useCompliance } from '../context/ComplianceContext';
import { ReportTemplate } from '../components/ReportTemplate';
import { LiveMap } from '../components/LiveMap';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { mockComplianceData } from '../data/mockData';
import { ShieldAlert, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

export function Dashboard() {
  const { t } = useTranslation();
  const { liveViolations } = useCompliance();
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'LMPC_Compliance_Report',
  });

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t('dashboard.overview_title')}</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => handlePrint()} className="badge badge-neutral" style={{ padding: '8px 16px', border: '1px solid var(--border-color)' }}>{t('dashboard.export_pdf')}</button>
          <select className="badge badge-neutral" style={{ padding: '8px 16px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <option value="30">{t('dashboard.last_30_days')}</option>
            <option value="90">{t('dashboard.last_90_days')}</option>
            <option value="all">{t('dashboard.all_time')}</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <StatCard 
          title={t('dashboard.total_inspections')} 
          value={mockComplianceData.nationalStats.totalInspections.toLocaleString()} 
          icon={<FileText size={20} />} 
          trend={{ value: 12, isPositive: true }} 
        />
        <StatCard 
          title={t('dashboard.compliant_products')} 
          value={mockComplianceData.nationalStats.compliant.toLocaleString()} 
          icon={<CheckCircle size={20} />} 
          trend={{ value: 5, isPositive: true }} 
        />
        <StatCard 
          title={t('dashboard.non_compliant')} 
          value={mockComplianceData.nationalStats.nonCompliant.toLocaleString()} 
          icon={<AlertTriangle size={20} />} 
          trend={{ value: 2, isPositive: false }} 
        />
        <StatCard 
          title={t('dashboard.critical_violations')} 
          value={mockComplianceData.nationalStats.criticalViolations.toLocaleString()} 
          icon={<ShieldAlert size={20} />} 
          trend={{ value: 8, isPositive: false }} 
        />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('dashboard.trend_title')}</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockComplianceData.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', color: '#fff' }} />
                <Line type="monotone" dataKey="complianceRate" name="Compliance Rate %" stroke="var(--success)" strokeWidth={2} />
                <Line type="monotone" dataKey="violations" name="Total Violations" stroke="var(--danger)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('dashboard.violation_types')}</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockComplianceData.violationTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockComplianceData.violationTypes.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geographic Live Map */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t('dashboard.map_title')}</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {t('dashboard.map_desc')}
            </p>
            <div style={{ height: '350px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <LiveMap />
            </div>
          </div>
          
          <div>
            <div style={{ height: '350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>{t('dashboard.live_feed')}</h4>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
                {liveViolations.length > 0 ? liveViolations.map(violation => (
                  <div key={violation.id} style={{ padding: '12px', borderLeft: '4px solid var(--danger)', backgroundColor: 'var(--bg-tertiary)', marginBottom: '8px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{violation.rule}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{violation.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {t('dashboard.detected_in')}: <span style={{ color: 'var(--text-primary)' }}>{violation.regionName}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ color: 'var(--text-secondary)' }}>{t('dashboard.awaiting_telemetry')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t('dashboard.recent_inspections')}</h3>
          <button style={{ color: 'var(--accent-color)', background: 'none', border: 'none', fontWeight: 500 }}>{t('dashboard.view_all')}</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('dashboard.table_id')}</th>
                <th>{t('dashboard.table_product')}</th>
                <th>{t('dashboard.table_manufacturer')}</th>
                <th>{t('dashboard.table_status')}</th>
                <th>{t('dashboard.table_severity')}</th>
                <th>{t('dashboard.table_date')}</th>
              </tr>
            </thead>
            <tbody>
              {mockComplianceData.recentInspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td style={{ color: 'var(--accent-color)', fontWeight: 500 }}>{inspection.id}</td>
                  <td>{inspection.product}</td>
                  <td>{inspection.manufacturer}</td>
                  <td><StatusBadge status={inspection.status} /></td>
                  <td><StatusBadge status={inspection.severity} type="severity" /></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{inspection.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Print Template */}
      <div style={{ display: 'none' }}>
        <ReportTemplate ref={componentRef} />
      </div>

    </div>
  );
}
