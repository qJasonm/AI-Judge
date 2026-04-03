const POOL = [
  { merchant: 'NETFLIX.COM', amount: 22.99, isRecurring: true, category: 'Entertainment', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
  { merchant: 'SPOTIFY USA', amount: 10.99, isRecurring: true, category: 'Music', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg' },
  { merchant: 'ADOBE SYSTEMS, INC.', amount: 54.99, isRecurring: true, category: 'Productivity', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Adobe_Corporate_logo.svg' },
  { merchant: 'PLANET FITNESS 109', amount: 39.00, isRecurring: true, category: 'Health', logo: 'https://upload.wikimedia.org/wikipedia/en/2/29/Planet_Fitness_logo.svg' },
  { merchant: 'CHATGPT SUBSCRIPTION', amount: 20.00, isRecurring: true, category: 'Productivity', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' },
  { merchant: 'HULU AD-FREE', amount: 17.99, isRecurring: true, category: 'Entertainment', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg' },
  { merchant: 'DISNEY PLUS', amount: 13.99, isRecurring: true, category: 'Entertainment', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' },
  { merchant: 'AMAZON PRIME', amount: 14.99, isRecurring: true, category: 'Shopping', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Amazon_Prime_Logo.svg/1024px-Amazon_Prime_Logo.svg.png' },
  { merchant: 'APPLE TV PLUS', amount: 9.99, isRecurring: true, category: 'Entertainment', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg' },
];

function analyzeTransactions() {
  // Shuffle pool and pick 5 to 8 random subscriptions
  const shuffled = [...POOL].sort(() => 0.5 - Math.random());
  const selectedCount = Math.floor(Math.random() * 4) + 5; // 5 to 8
  const selectedSubs = shuffled.slice(0, selectedCount);

  // Generate mock RAW_TRANSACTIONS including noise
  let rawCount = 0;
  
  const subscriptionsMap = new Map();
  selectedSubs.forEach(tx => {
    // Generate 2 months of history for each picked sub
    rawCount += 2;
    subscriptionsMap.set(tx.merchant, {
        id: tx.merchant.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: tx.merchant.split(' ')[0].replace('.COM', ''), // Clean name up for display
        cost: tx.amount,
        category: tx.category,
        logoUrl: tx.logo,
        billingCycle: 'monthly',
        nextBillingDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
    });
  });

  // Add random noise
  rawCount += Math.floor(Math.random() * 15) + 10; // add 10-25 random transactions

  const subscriptions = Array.from(subscriptionsMap.values());
  const monthlyWaste = subscriptions.reduce((sum, sub) => sum + sub.cost, 0);

  return {
    rawCount,
    subscriptionCount: subscriptions.length,
    monthlyWaste,
    subscriptions
  };
}

module.exports = {
  analyzeTransactions
};
