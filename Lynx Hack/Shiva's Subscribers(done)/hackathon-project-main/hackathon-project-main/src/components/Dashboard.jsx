import React, { useState, useEffect } from 'react';
import { fetchSubscriptions } from '../services/mockData';
import SubscriptionList from './SubscriptionList';
import { CreditCard, TrendingUp, Activity } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchSubscriptions();
        setSubscriptions(data);
      } catch (error) {
        console.error("Failed to load subscriptions", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalMonthlySpend = subscriptions.reduce((total, sub) => {
    return total + (sub.billingCycle === 'monthly' ? sub.cost : sub.cost / 12);
  }, 0);

  const activeCount = subscriptions.filter(s => s.status === 'active').length;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Overview</h1>
        <p className="dashboard-subtitle">Manage your recurring expenses and subscriptions.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Monthly Spend</p>
            <h2 className="stat-value">
              {loading ? <span className="skeleton-text animate-pulse"></span> : `$${totalMonthlySpend.toFixed(2)}`}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Subscriptions</p>
            <h2 className="stat-value">
              {loading ? <span className="skeleton-text animate-pulse"></span> : activeCount}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Projected Yearly</p>
            <h2 className="stat-value">
              {loading ? <span className="skeleton-text animate-pulse"></span> : `$${(totalMonthlySpend * 12).toFixed(2)}`}
            </h2>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="section-header">
          <h2>Your Subscriptions</h2>
          <button className="primary-btn">Add New</button>
        </div>
        <SubscriptionList subscriptions={subscriptions} loading={loading} />
      </div>
    </div>
  );
};

export default Dashboard;
