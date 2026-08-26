const mongoose = require('mongoose');

// Apply this plugin to tenant-owned schemas. Every read or bulk mutation must
// include restaurantId in its filter so tenant data cannot be queried broadly.
function tenantPlugin(schema) {
  schema.add({
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      index: true
    }
  });

  const guardedOperations = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'updateMany',
    'deleteMany'
  ];

  guardedOperations.forEach((operation) => {
    schema.pre(operation, function guardTenantFilter() {
      const filter = this.getFilter();
      if (!filter.restaurantId) {
        throw new Error(`restaurantId is required for ${operation} queries`);
      }
    });
  });
}

module.exports = tenantPlugin;
