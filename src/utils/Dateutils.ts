export function getMinutesUntil(futureDate: Date) {
  const future = new Date(futureDate); // x = future time
  const now = new Date();
  const diffMs = future.getTime() - now.getTime(); // difference in milliseconds
  const diffMins = Math.ceil(diffMs / 60000); // convert to minutes, round up
  return diffMins;
}
