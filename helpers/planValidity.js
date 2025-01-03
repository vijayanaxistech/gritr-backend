function planValidity(row) {
  const today = new Date();
  const expiryDate = new Date(row.edate);
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  if (expiryDate < today) {
    return false
  } else {
    return true
  }
}

module.exports = planValidity