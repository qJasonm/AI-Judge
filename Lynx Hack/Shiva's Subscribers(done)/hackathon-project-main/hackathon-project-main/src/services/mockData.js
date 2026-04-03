export const mockSubscriptions = [
  {
    id: '1',
    name: 'Netflix',
    category: 'Entertainment',
    cost: 15.99,
    billingCycle: 'monthly',
    nextBillingDate: '2026-04-15',
    icon: 'Tv', // Mapped to Lucide component string
    status: 'active',
  },
  {
    id: '2',
    name: 'Spotify',
    category: 'Music',
    cost: 10.99,
    billingCycle: 'monthly',
    nextBillingDate: '2026-04-12',
    icon: 'Headphones',
    status: 'active',
  },
  {
    id: '3',
    name: 'Adobe Creative Cloud',
    category: 'Software',
    cost: 54.99,
    billingCycle: 'monthly',
    nextBillingDate: '2026-04-20',
    icon: 'PenTool',
    status: 'active',
  },
  {
    id: '4',
    name: 'Amazon Prime',
    category: 'Shopping',
    cost: 139.00,
    billingCycle: 'yearly',
    nextBillingDate: '2026-11-01',
    icon: 'Package',
    status: 'active',
  },
  {
    id: '5',
    name: 'Gym Membership',
    category: 'Health',
    cost: 49.99,
    billingCycle: 'monthly',
    nextBillingDate: '2026-04-05',
    icon: 'Dumbbell',
    status: 'active',
  },
  {
    id: '6',
    name: 'ChatGPT Plus',
    category: 'Productivity',
    cost: 20.00,
    billingCycle: 'monthly',
    nextBillingDate: '2026-04-22',
    icon: 'Cpu',
    status: 'active',
  }
];

/**
 * Simulates an API call to fetch subscriptions.
 * @returns {Promise<Array>} A promise that resolves to the mock data.
 */
export const fetchSubscriptions = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockSubscriptions]);
    }, 800); // Simulate 800ms network latency
  });
};
