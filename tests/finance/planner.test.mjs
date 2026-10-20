import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRupees, calculateFund, formatRupees } from '../../assets/finance/planner.mjs';

test('parses exact rupees and paise without floating point rounding', () => {
  assert.equal(parseRupees('12500.05'), 1250005);
  assert.equal(parseRupees('0.01'), 1);
  assert.equal(parseRupees('0'), 0);
  assert.equal(parseRupees('100000000'), 10000000000);
});

test('rejects unsupported or ambiguous amounts', () => {
  for (const value of ['', ' ', '-1', '1.001', '1,000', '1e3', '₹50', '100000000.01', 'abc']) {
    assert.throws(() => parseRupees(value), /amount/i, value);
  }
});

test('calculates target, gap, coverage and contribution timeline', () => {
  assert.deepEqual(calculateFund({expensesPaise: 3500000, savingsPaise: 5000000, months: 6, contributionPaise: 1000000}), {
    targetPaise: 21000000, gapPaise: 16000000, coveredMonths: 1,
    remainingPaise: 1500000, monthsToGoal: 16
  });
});

test('goal already met has zero gap and zero additional months', () => {
  assert.deepEqual(calculateFund({expensesPaise: 2500000, savingsPaise: 20000000, months: 6, contributionPaise: 0}), {
    targetPaise: 15000000, gapPaise: 0, coveredMonths: 8,
    remainingPaise: 0, monthsToGoal: 0
  });
});

test('no monthly contribution does not invent a completion date', () => {
  const result = calculateFund({expensesPaise: 1000000, savingsPaise: 0, months: 3, contributionPaise: 0});
  assert.equal(result.monthsToGoal, null);
  assert.equal(result.coveredMonths, 0);
});

test('zero expenses cannot yield a misleading fully funded plan', () => {
  assert.throws(() => calculateFund({expensesPaise: 0, savingsPaise: 1000000, months: 6, contributionPaise: 0}), /expenses/i);
});

test('rejects invalid target or unsafe values', () => {
  for (const months of [0, 25, 1.5, NaN]) {
    assert.throws(() => calculateFund({expensesPaise: 100, savingsPaise: 0, months, contributionPaise: 0}), /target months/i);
  }
  assert.throws(() => calculateFund({expensesPaise: -1, savingsPaise: 0, months: 6, contributionPaise: 0}), /amount/i);
  assert.throws(() => calculateFund({expensesPaise: Number.MAX_SAFE_INTEGER, savingsPaise: 0, months: 6, contributionPaise: 0}), /amount/i);
});

test('formats INR with Indian grouping and two decimal places', () => {
  assert.equal(formatRupees(123456789), '₹12,34,567.89');
});
