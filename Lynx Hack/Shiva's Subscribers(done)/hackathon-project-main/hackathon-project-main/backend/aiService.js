const OpenAI = require('openai');

// User provided key for the hackathon
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "YOUR_API_KEY", // The provided key
});

async function analyzeSubscription(subscription) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Act as a personal finance AI. Give a 1-sentence recommendation (max 12 words) suggesting whether to keep or cancel a given subscription. Keep it clever and punchy." },
        { role: "user", content: `The user spends $${subscription.cost}/${subscription.billingCycle} on ${subscription.name}.` }
      ],
      temperature: 0.7,
      max_tokens: 40,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI Error in analyzeSubscription:", error);
    return `Review your ${subscription.name} usage to potentially save $${subscription.cost}.`;
  }
}

async function handleChat(message, db) {
  try {
     const dbContext = `User Data Context:
     - Total subscriptions found: ${db.subscriptions.length}
     - Total monthly waste: $${db.monthlyWaste.toFixed(2)}
     - Active subscriptions: ${db.subscriptions.map(s => s.name).join(', ')}`;

     const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `You are SubSave AI, a brilliantly smart but somewhat sassy personal finance assistant. Keep your answers brief, conversational, and helpful. Always try to find ways to slash their billing. \n\n${dbContext}` },
        { role: "user", content: message }
      ],
      temperature: 0.8,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
     console.error("OpenAI Error in handleChat:", error);
     return "Oops, I encountered an error. Is my OpenAI API key active?";
  }
}

async function getAlternativeSuggestions(subscription) {
  try {
     const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a cost-cutting AI. Find 3 cheaper or free alternatives to the user's service. Return ONLY a valid JSON array of objects. Example structure: [ { \"name\": \"Peacock (Ad-Supported)\", \"cost\": 5.99, \"logoUrl\": \"https://logo.clearbit.com/peacocktv.com\", \"savings\": 10.00, \"reason\": \"Just $5.99/mo with ads!\" } ] NO MARKDOWN WRAPPERS OR TICK MARKS. JUST PURE RAW JSON ARRAY." },
        { role: "user", content: `Find 3 cheaper or free alternatives to ${subscription.name} (which currently costs $${subscription.cost}/${subscription.billingCycle}).` }
      ],
      temperature: 0.3,
    });
    
     let text = response.choices[0].message.content.trim();
     if(text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
     if(text.startsWith('```')) text = text.replace(/```/g, '').trim();

     const parsed = JSON.parse(text);
     return parsed.map((item, idx) => ({...item, id: `alt_${idx}`}));

  } catch (error) {
     console.error("OpenAI Error in getAlternatives:", error);
     return [
        { id: '1', name: 'Cheaper Alternative 1', cost: (subscription.cost * 0.5).toFixed(2), logoUrl: 'https://logo.clearbit.com/generic.com', savings: (subscription.cost * 0.5).toFixed(2), reason: 'Save 50%!' },
        { id: '2', name: 'Free Alternative 2', cost: 0, logoUrl: 'https://logo.clearbit.com/generic.com', savings: subscription.cost.toFixed(2), reason: 'Totally free with ads.' }
     ];
  }
}

module.exports = { analyzeSubscription, handleChat, getAlternativeSuggestions };
