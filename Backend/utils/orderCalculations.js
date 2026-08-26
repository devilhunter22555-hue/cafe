function calculateOrderTotals(items, discount = 0) {
  let subtotal = 0;
  let tax = 0;

  for (const item of items) {
    if (item.status === 'cancelled') continue;

    const quantity = Number(item.qty) || 0;
    const modifierTotal = (item.selectedModifiers || []).reduce(
      (sum, modifier) => sum + (Number(modifier.priceDelta) || 0),
      0
    );
    const itemSubtotal = (Number(item.price) + modifierTotal) * quantity;

    subtotal += itemSubtotal;
    tax += itemSubtotal * ((Number(item.taxSlab) || 0) / 100);
  }

  const cgst = tax / 2;
  const sgst = tax / 2;

  return {
    subtotal,
    cgst,
    sgst,
    total: subtotal + cgst + sgst - (Number(discount) || 0)
  };
}

module.exports = calculateOrderTotals;