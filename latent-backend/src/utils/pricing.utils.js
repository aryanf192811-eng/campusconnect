// src/utils/pricing.utils.js
// Parul University mess pricing: Breakfast ₹30, Lunch ₹65 (₹80 Sun), Dinner ₹65 (₹50 Sun)

const getMealPrice = (mealType, dateStr) => {
  const d = new Date(dateStr);
  const isSun = d.getDay() === 0;
  const prices = {
    breakfast: 30,
    lunch:     isSun ? 80 : 65,
    dinner:    isSun ? 50 : 65,
  };
  return prices[mealType] || 65;
};

const getValidUntil = (mealType) =>
  ({ breakfast: '07:30', lunch: '13:30', dinner: '20:00' }[mealType]);

module.exports = { getMealPrice, getValidUntil };
