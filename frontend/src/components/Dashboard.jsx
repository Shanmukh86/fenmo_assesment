import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export function Dashboard() {
  const [data, setData] = useState({ byCategory: [], monthly: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.request('/summary');
        if (!mounted) return;
        setData(res.data || { byCategory: [], monthly: [] });
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="card">Loading dashboard...</div>;
  if (error) return <div className="card">Error: {error}</div>;

  const { byCategory = [], monthly = [] } = data;

  const pieData = {
    labels: byCategory.map(b => b.category),
    datasets: [{ data: byCategory.map(b => b.total), backgroundColor: [ '#2563eb', '#f97316', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b' ] }]
  };

  const lineData = {
    labels: monthly.map(m => m.month),
    datasets: [{ label: 'Spending', data: monthly.map(m => m.total), fill: false, borderColor: '#2563eb', tension: 0.2 }]
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h2>Dashboard</h2>
      <div className="main-grid" style={{ marginTop: '1rem' }}>
        <div className="card chart-card">
          <h3>Spending by Category</h3>
          {byCategory.length === 0 ? <p>No data</p> : <Pie data={pieData} />}
        </div>
        <div className="card chart-card">
          <h3>Monthly Trend (last 12 months)</h3>
          {monthly.length === 0 ? <p>No data</p> : <Line data={lineData} />}
        </div>
      </div>
    </div>
  );
}
