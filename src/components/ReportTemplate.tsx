import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { mockComplianceData } from '../data/mockData';

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

export const ReportTemplate = forwardRef<HTMLDivElement>((_props, ref) => {
  const { t } = useTranslation();

  return (
    <div ref={ref} style={{ padding: '40px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>{t('report.header_dept')}</h1>
          <h2 style={{ fontSize: '18px', margin: '8px 0 0 0', color: '#4a5568' }}>{t('report.header_title')}</h2>
        </div>
        <div style={{ textAlign: 'right', fontSize: '14px', color: '#4a5568' }}>
          <p style={{ margin: 0 }}>{t('report.date')}: {new Date().toLocaleDateString()}</p>
          <p style={{ margin: 0 }}>{t('report.generated_by')}</p>
        </div>
      </div>

      {/* Executive Summary */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>{t('report.exec_summary_title')}</h3>
        <p style={{ lineHeight: '1.6', color: '#2d3748', marginTop: '16px' }}>
          {t('report.exec_summary_p1', { 
            total: mockComplianceData.nationalStats.totalInspections.toLocaleString(), 
            critical: mockComplianceData.nationalStats.criticalViolations.toLocaleString() 
          })}
        </p>
        <p style={{ lineHeight: '1.6', color: '#2d3748' }}>
          {t('report.exec_summary_p2')}
        </p>
      </section>

      {/* Graphical Analysis */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '20px' }}>{t('report.graphical_title')}</h3>
        
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          {/* Trend Chart */}
          <div>
            <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Compliance Trend (Last 6 Months)</h4>
            <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <LineChart width={650} height={250} data={mockComplianceData.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#4a5568" />
                <YAxis stroke="#4a5568" />
                <Line type="monotone" dataKey="complianceRate" name="Compliance Rate %" stroke="#10b981" strokeWidth={2} isAnimationActive={false} />
                <Line type="monotone" dataKey="violations" name="Total Violations" stroke="#ef4444" strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </div>
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              <em>{t('report.trend_caption')}</em>
            </p>
          </div>

          {/* Pie Chart */}
          <div style={{ marginTop: '20px', pageBreakInside: 'avoid' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Distribution of Violation Types</h4>
            <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <PieChart width={650} height={250}>
                <Pie
                  data={mockComplianceData.violationTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  isAnimationActive={false}
                >
                  {mockComplianceData.violationTypes.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </div>
          </div>
        </div>
      </section>

      {/* Critical Action Items Table */}
      <section style={{ pageBreakInside: 'avoid' }}>
        <h3 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>{t('report.critical_items_title')}</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #cbd5e0' }}>
              <th style={{ padding: '10px' }}>{t('dashboard.table_id')}</th>
              <th style={{ padding: '10px' }}>{t('dashboard.table_product')}</th>
              <th style={{ padding: '10px' }}>{t('dashboard.table_manufacturer')}</th>
              <th style={{ padding: '10px' }}>{t('dashboard.table_status')}</th>
              <th style={{ padding: '10px' }}>{t('dashboard.table_date')}</th>
            </tr>
          </thead>
          <tbody>
            {mockComplianceData.recentInspections.slice(0, 5).map(inspection => (
              <tr key={inspection.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{inspection.id}</td>
                <td style={{ padding: '10px' }}>{inspection.product}</td>
                <td style={{ padding: '10px' }}>{inspection.manufacturer}</td>
                <td style={{ padding: '10px' }}>{inspection.status}</td>
                <td style={{ padding: '10px' }}>{inspection.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
});

ReportTemplate.displayName = 'ReportTemplate';
