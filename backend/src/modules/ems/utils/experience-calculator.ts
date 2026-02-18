export function calculateExperience(fromDate: Date, toDate: Date): { years: number; months: number } {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (to.getDate() < from.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  return { years, months };
}

