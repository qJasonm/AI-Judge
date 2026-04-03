const mockUser = {
  id: 'user_123',
  name: 'Alex Developer',
  email: 'alex@example.com',
  onboardingCompleted: false
};

const mockSubscriptions = [
  {
    id: 'sub_1',
    userId: 'user_123',
    name: 'Netflix',
    cost: 15.99,
    billingCycle: 'monthly',
    nextBillingDate: '2026-04-15',
    icon: 'Tv',
    status: 'active',
  },
  {
    id: 'sub_2',
    userId: 'user_123',
    name: 'Spotify',
    cost: 10.99,
    billingCycle: 'monthly',
    nextBillingDate: '2026-04-12',
    icon: 'Headphones',
    status: 'active',
  },
  {
    id: 'sub_3',
    userId: 'user_123',
    name: 'Adobe Creative Cloud',
    cost: 54.99,
    billingCycle: 'monthly',
    nextBillingDate: '2026-04-20',
    icon: 'PenTool',
    status: 'active',
  },
  {
    id: 'sub_4',
    userId: 'user_123',
    name: 'Amazon Prime',
    cost: 139.00,
    billingCycle: 'yearly',
    nextBillingDate: '2026-11-01',
    icon: 'Package',
    status: 'active',
  },
  {
    id: 'sub_5',
    userId: 'user_123',
    name: 'Gym Membership',
    cost: 49.99,
    billingCycle: 'monthly',
    nextBillingDate: '2026-04-05',
    icon: 'Dumbbell',
    status: 'active',
  },
  {
    id: 'sub_6',
    userId: 'user_123',
    name: 'ChatGPT Plus',
    cost: 20.00,
    billingCycle: 'monthly',
    nextBillingDate: '2026-04-22',
    icon: 'Cpu',
    status: 'active',
  }
];

module.exports = { mockUser, mockSubscriptions };
