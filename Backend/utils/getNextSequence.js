const Counter = require('../models/Counter');

async function getNextSequence({ restaurantId, branchId, name, dateKey = null, session }) {
  const counter = await Counter.findOneAndUpdate(
    { restaurantId, branchId, name, dateKey },
    { $inc: { value: 1 } },
    { new: true, upsert: true, session }
  );

  return counter.value;
}

module.exports = getNextSequence;