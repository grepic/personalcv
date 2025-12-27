import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface Stats {
  totalUsers: number;
  totalJobs: number;
  totalPosts: number;
  totalApplications: number;
  activeUsers: number;
  newUsersToday: number;
  newJobsToday: number;
  revenue: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert('Admin access required');
      }
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 text-danger-800">
          Failed to load admin dashboard. You may not have admin access.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Platform overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            change={`+${stats.newUsersToday} today`}
            color="primary"
            icon="👥"
          />
          <StatCard
            title="Total Jobs"
            value={stats.totalJobs}
            change={`+${stats.newJobsToday} today`}
            color="secondary"
            icon="💼"
          />
          <StatCard
            title="Total Posts"
            value={stats.totalPosts}
            change={`${stats.totalApplications} applications`}
            color="success"
            icon="📝"
          />
          <StatCard
            title="Revenue"
            value={`${Math.round(stats.revenue).toLocaleString()} Kč`}
            change={`${stats.activeUsers} active users`}
            color="warning"
            icon="💰"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            title="User Management"
            description="View and manage all users"
            link="/admin/users"
            icon="👤"
            color="primary"
          />
          <ActionCard
            title="Job Management"
            description="Moderate job postings"
            link="/admin/jobs"
            icon="💼"
            color="secondary"
          />
          <ActionCard
            title="Analytics"
            description="View platform analytics"
            link="/admin/analytics"
            icon="📊"
            color="success"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change: string;
  color: string;
  icon: string;
}> = ({ title, value, change, color, icon }) => {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    secondary: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
    success: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
    warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{change}</p>
    </div>
  );
};

const ActionCard: React.FC<{
  title: string;
  description: string;
  link: string;
  icon: string;
  color: string;
}> = ({ title, description, link, icon, color }) => {
  const colorClasses = {
    primary: 'border-primary-200 dark:border-primary-800 hover:border-primary-400',
    secondary: 'border-secondary-200 dark:border-secondary-800 hover:border-secondary-400',
    success: 'border-success-200 dark:border-success-800 hover:border-success-400',
  };

  return (
    <a
      href={link}
      className={`card-hover p-6 border-2 ${colorClasses[color as keyof typeof colorClasses]} transition-colors`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </a>
  );
};

export default AdminDashboard;