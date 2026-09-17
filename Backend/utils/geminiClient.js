const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function formatNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizeItemList(items, label) {
  if (!Array.isArray(items) || items.length === 0) {
    return `${label}: none`;
  }

  return `${label}: ${items
    .slice(0, 5)
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item?.name) {
        const details = [];
        if (item.percentChange != null) details.push(`${Math.abs(Number(item.percentChange) || 0).toFixed(1)}% change`);
        if (item.estimatedDaysRemaining != null) details.push(`${Number(item.estimatedDaysRemaining).toFixed(1)} days remaining`);
        return details.length ? `${item.name} (${details.join(', ')})` : item.name;
      }
      return JSON.stringify(item);
    })
    .join('; ')}`;
}

async function generateInsightSummary(dataContext) {
  try {
    if (!genAI || !dataContext) {
      return null;
    }

    const foodCost = dataContext.foodCost || {};
    const priceTrends = Array.isArray(dataContext.priceTrends) ? dataContext.priceTrends : [];
    const lowStock = Array.isArray(dataContext.lowStock) ? dataContext.lowStock : [];

    const foodCostPercentage = formatNumber(foodCost.foodCostPercentage);
    const totalRevenue = formatNumber(foodCost.totalRevenue);
    const estimatedFoodCost = formatNumber(foodCost.estimatedFoodCost);
    const itemsWithUnknownCost = Array.isArray(foodCost.itemsWithUnknownCost) ? foodCost.itemsWithUnknownCost : [];
    const highestPriceChange = priceTrends.length
      ? priceTrends.reduce((max, item) => Math.abs(Number(item.percentChange) || 0) > Math.abs(Number(max.percentChange) || 0) ? item : max, priceTrends[0])
      : null;
    const stockRisk = lowStock.length ? lowStock[0] : null;

    const prompt = `
You are reviewing a restaurant operations summary.

Only use facts directly supported by the provided numbers. Do not invent causes, trends, or explanations that are not present in the data.
If the data is insufficient to draw a conclusion (for example, food cost percentage is missing because recipes or ingredient prices are not available), say that plainly instead of guessing.

Write 2 to 4 short, plain-English sentences in a friendly but direct tone like a smart business partner. Avoid robotic phrasing.

Data:
- Food cost percentage: ${foodCostPercentage ?? 'not available'}
- Total revenue: ${totalRevenue}
- Estimated food cost: ${estimatedFoodCost}
- Items with unknown cost: ${itemsWithUnknownCost.length > 0 ? itemsWithUnknownCost.map((item) => `${item.name}: ${item.reason || 'missing data'}`).join('; ') : 'none'}
- Significant price trend items: ${priceTrends.length > 0 ? priceTrends.slice(0, 5).map((item) => `${item.name}: ${Number(item.percentChange || 0).toFixed(1)}%`).join('; ') : 'none'}
- Top price change: ${highestPriceChange ? `${highestPriceChange.name}: ${Number(highestPriceChange.percentChange || 0).toFixed(1)}%` : 'none'}
- Low-stock items: ${lowStock.length > 0 ? lowStock.slice(0, 5).map((item) => `${item.name}: ${Number(item.estimatedDaysRemaining || 0).toFixed(1)} days remaining`).join('; ') : 'none'}
- Most urgent low-stock item: ${stockRisk ? `${stockRisk.name}: ${Number(stockRisk.estimatedDaysRemaining || 0).toFixed(1)} days remaining` : 'none'}

Return only the final summary text, no bullet list, no markdown.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { temperature: 0.3 } });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini summary generation failed:', error.message || error);
    return null;
  }
}

module.exports = {
  generateInsightSummary
};
