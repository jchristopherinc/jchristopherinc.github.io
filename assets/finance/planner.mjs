// Amounts are nonnegative integer paise. The input limit bounds every UI result
// to Number's exact integer range, including a 24-month target.
const MAX_RUPEES = 100000000;
const MAX_PAISE = MAX_RUPEES * 100;

export function parseRupees(input) {
  if (typeof input !== 'string' || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(input.trim())) {
    throw new RangeError('Enter a valid amount in rupees with up to two decimal places.');
  }
  const [whole, fraction = ''] = input.trim().split('.');
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(paise) || paise > MAX_PAISE) {
    throw new RangeError('Amount exceeds the supported limit.');
  }
  return paise;
}

export function calculateFund({ expensesPaise, savingsPaise, months, contributionPaise }) {
  const amounts = [expensesPaise, savingsPaise, contributionPaise];
  if (amounts.some((value) => !Number.isSafeInteger(value) || value < 0 || value > MAX_PAISE)) {
    throw new RangeError('Each amount must be a nonnegative, supported INR value.');
  }
  if (expensesPaise === 0) throw new RangeError('Enter monthly essential expenses greater than zero.');
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    throw new RangeError('Target months must be a whole number between 1 and 24.');
  }
  const targetPaise = expensesPaise * months;
  const gapPaise = Math.max(0, targetPaise - savingsPaise);
  const coveredMonths = Math.floor(savingsPaise / expensesPaise);
  const remainingPaise = savingsPaise % expensesPaise;
  const monthsToGoal = gapPaise === 0 ? 0 : contributionPaise === 0 ? null : Math.ceil(gapPaise / contributionPaise);
  return { targetPaise, gapPaise, coveredMonths, remainingPaise, monthsToGoal };
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function formatRupees(paise) {
  if (!Number.isSafeInteger(paise) || paise < 0) throw new RangeError('Invalid amount.');
  return inr.format(paise / 100).replace(/\u00a0/g, '');
}
