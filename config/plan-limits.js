const planLimits = {
  free: { daily: 50, perMinute: 3 },
  basic: { daily: 500, perMinute: 20 },
  pro: { daily: -1, perMinute: -1 } // -1 means unlimited
};

function getLimitsByPlan(plan) {
  return planLimits[plan] || planLimits.free;
}

module.exports = {
  planLimits,
  getLimitsByPlan
};
