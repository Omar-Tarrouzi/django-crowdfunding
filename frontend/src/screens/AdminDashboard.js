import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/admin-stats/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return <div>No stats found</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div>
        <h2>Total Projects: {stats.total_projects}</h2>
        <h2>Total Donations: {stats.total_donations}</h2>
        <h2>Total Users: {stats.total_users}</h2>
        {/* Add more JSX to display other stats */}
      </div>
    </div>
  );
};

export default AdminDashboard; 