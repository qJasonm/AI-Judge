import React from 'react';
import * as LucideIcons from 'lucide-react';
import './SubscriptionCard.css';

const SubscriptionCard = ({ subscription }) => {
  const { name, category, cost, billingCycle, nextBillingDate, icon } = subscription;

  const IconComponent = LucideIcons[icon] || LucideIcons.Circle;

  return (
    <div className="subscription-card">
      <div className="card-header">
        <div className="icon-container">
          <IconComponent size={24} className="icon" />
        </div>
        <div className="name-category">
          <h3>{name}</h3>
          <span className="category">{category}</span>
        </div>
        <div className="cost-container">
          <span className="cost">${cost.toFixed(2)}</span>
          <span className="billing-cycle">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
        </div>
      </div>
      <div className="card-footer">
        <div className="next-billing">
          <span className="label">Next Payment</span>
          <span className="date">{new Date(nextBillingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
        </div>
        <button className="manage-btn">Manage</button>
      </div>
    </div>
  );
};

export default SubscriptionCard;
