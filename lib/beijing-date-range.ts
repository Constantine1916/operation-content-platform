export function getBeijingDateRange(date: string): {
  startIso: string;
  endIso: string;
} {
  const start = new Date(`${date}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 86400000);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}
