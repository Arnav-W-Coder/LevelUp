export const getDateKey = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0]; // e.g. "2025-06-30"
};

export const getToday = () => getDateKey();        // "2025-06-30"
export const getYesterday = () => getDateKey(-1);  // "2025-06-29"
