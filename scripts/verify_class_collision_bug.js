function oldIsSameClass(g1, g2) {
  if (!g1 || !g2) return true;
  const s1 = g1.toString().toLowerCase();
  const s2 = g2.toString().toLowerCase();
  if (s1 === 'all' || s2 === 'all' || s1.includes('all') || s2.includes('all')) return true;
  const norm1 = s1.replace(/class/g, '').replace(/th|st|nd|rd/g, '').trim();
  const norm2 = s2.replace(/class/g, '').replace(/th|st|nd|rd/g, '').trim();
  return norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1);
}

console.log('Old isSameClass("10th Class", "1st Class"):', oldIsSameClass("10th Class", "1st Class")); // returns true! BUG!
console.log('Old isSameClass("1st Class", "10th Class"):', oldIsSameClass("1st Class", "10th Class")); // returns true! BUG!
