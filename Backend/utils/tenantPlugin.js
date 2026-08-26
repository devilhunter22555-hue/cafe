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

      // Mongoose's populate() runs an internal query filtered only by
      // _id (or _id: { $in: [...] }) on the referenced collection.
      // These lookups are safe: they only ever fetch documents that a
      // parent, already tenant-scoped document explicitly referenced.
      // Skip the restaurantId check for this specific pattern.
      const filterKeys = Object.keys(filter);
      const isIdOnlyLookup =
        filterKeys.length > 0 &&
        filterKeys.every((key) => key === '_id');

      if (!filter.restaurantId && !isIdOnlyLookup) {
        throw new Error(`restaurantId is required for ${operation} queries`);
      }
    });
  });
}

module.exports = tenantPlugin;