import type { Transaction, Budget } from '../lib/types'

export const generateInsights = async (transactions: Transaction[], budgets: Budget[]) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  
  const prompt = `
    You are a professional financial advisor. Analyze the following local personal finance data and provide 3-4 actionable insights.
    
    Current Transactions (Last 30 days):
    ${JSON.stringify(transactions.map(t => ({ date: t.date, category: t.category, amount: t.amount, type: t.type })))}
    
    Current Budgets & Spending:
    ${JSON.stringify(budgets.map(b => ({ category: b.category, limit: b.monthly_limit, spent: b.spent })))}
    
    Format your response as a JSON array of objects with "title", "description", and "type" (one of: 'warning', 'success', 'tip').
    Make the advice specific to the data provided. Use Indian Rupee (₹) in descriptions.
    Return ONLY the JSON.
  `

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-001",
        "messages": [
          { "role": "user", "content": prompt }
        ]
      })
    })

    const data = await response.json()
    const content = data.choices[0].message.content
    // Extract JSON if wrapped in markdown
    const jsonString = content.includes('```') 
      ? content.split('```')[1].replace('json', '').trim() 
      : content.trim()
    
    return JSON.parse(jsonString)
  } catch (error) {
    console.error("OpenRouter Error:", error)
    return [
      {
        title: "AI Analysis Unavailable",
        description: "We couldn't reach the AI advisor right now. Please check your API key or try again later.",
        type: "warning"
      }
    ]
  }
}
