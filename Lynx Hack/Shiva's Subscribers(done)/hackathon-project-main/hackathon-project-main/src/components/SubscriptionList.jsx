import React from 'react';
import SubscriptionCard from './SubscriptionCard';
import './SubscriptionList.css';

const SubscriptionList = ({ subscriptions, loading }) => {
  if (loading) {
    return (
      <div className="subscription-list-loading">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton-card animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="empty-state">
        <p>No active subscriptions found.</p>
        <button className="add-btn">Add New</button>
      </div>
    );
  }

  return (
    <div className="subscription-list">
      {subscriptions.map((sub) => (
        <SubscriptionCard key={sub.id} subscription={sub} />
      ))}
    </div>
  );
};

export default SubscriptionList;
