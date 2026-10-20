import { parseRupees, calculateFund, formatRupees } from './planner.mjs';

const form = document.getElementById('fund-form');
const error = document.getElementById('fund-error');
const figures = document.getElementById('fund-figures');
const empty = document.getElementById('fund-empty');
const output = (id, value) => { document.getElementById(id).textContent = value; };

form.addEventListener('submit', (event) => {
  event.preventDefault();
  error.hidden = true;
  const expenses = form.elements.expenses.value.trim();
  const savings = form.elements.savings.value.trim();
  const contribution = form.elements.contribution.value.trim();
  try {
    if (!expenses || !savings) throw new RangeError('Enter monthly essential expenses and current savings. Use 0 if you have no savings yet.');
    const result = calculateFund({
      expensesPaise: parseRupees(expenses),
      savingsPaise: parseRupees(savings),
      months: Number(form.elements.months.value),
      contributionPaise: contribution ? parseRupees(contribution) : 0
    });
    output('fund-target', formatRupees(result.targetPaise));
    output('fund-gap', formatRupees(result.gapPaise));
    output('fund-coverage', `${result.coveredMonths} ${result.coveredMonths === 1 ? 'month' : 'months'} plus ${formatRupees(result.remainingPaise)} toward the next month`);
    output('fund-timeline', result.monthsToGoal === 0 ? 'Target already met' :
      result.monthsToGoal === null ? 'Add a contribution to estimate a timeline' :
      `${result.monthsToGoal} ${result.monthsToGoal === 1 ? 'month' : 'months'} at this contribution`);
    output('fund-method', 'Target = monthly essentials × target months. Gap = target minus current savings (minimum ₹0). Coverage shows full months plus savings toward the next month. Timeline rounds the gap ÷ monthly contribution up to whole months.');
    empty.hidden = true; figures.hidden = false;
  } catch (cause) {
    figures.hidden = true; empty.hidden = false;
    error.textContent = cause.message;
    error.hidden = false;
  }
});
