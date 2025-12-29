'use strict';

const init = () => ({ added: new Map(), removed: new Map() });

const value = ({ added, removed }) => {
  const result = new Set();
  for (const [value, addedTimestamp] of added.entries()) {
    const removedTimestamp = removed.get(value) || 0;
    if (addedTimestamp > removedTimestamp) result.add(value);
  }
  return result
}

const add = (state, value, timestamp = Date.now()) => {
  const delta = { added: new Map(), removed: new Map() };
  const prev = state.added.get(value) || 0;
  if (timestamp > prev) {
    state.added.set(value, timestamp);
    delta.added.set(value, timestamp);
  }
  return delta;
};

const rem = (state, value, timestamp = Date.now()) => {
  const delta = { added: new Map(), removed: new Map() };
  const prev = state.removed.get(value) || 0;
  if (timestamp > prev) {
    state.removed.set(value, timestamp);
    delta.removed.set(value, timestamp);
  }
  return delta;
};

const keysUnion = (state1, state2) => {
  const keys = new Set();
  for (const key of state1.keys()) keys.add(key);
  for (const key of state2.keys()) keys.add(key);
  return keys;
};

const mergeTimestampsMap = (map1, map2) => {
  const result = new Map();
  for (const value of keysUnion(map1, map2)) {
    const map1Timestamp = map1.get(value) || 0;
    const map2Timestamp = map2.get(value) || 0;
    result.set(value, Math.max(map1Timestamp, map2Timestamp));
  }
  return result;
}

const join = (state1, state2) => {
  const { added: added1 = new Map, removed: removed1 = new Map() } = state1;
  const { added: added2 = new Map, removed: removed2 = new Map() } = state2;
  return { added: mergeTimestampsMap(added1, added2), removed: mergeTimestampsMap(removed1, removed2) }
}

// Usage

console.log('Replica A');
const stateA = init();
const deltaA1 = add(stateA, 'first');
const stateA2 = join(stateA, deltaA1);
const deltaA2 = add(stateA2, 'second');
const stateA3 = join(stateA2, deltaA2);
const deltaA3 = rem(stateA3, 'second');
const stateA4 = join(stateA3, deltaA3);
console.log({ deltaA1, stateA2, deltaA2, stateA3, deltaA3, stateA4 });

console.log('Replica B');
const stateB = init();
const deltaB1 = add(stateB, 'first');
const stateB1 = join(stateB, deltaB1);
const deltaB2 = add(stateB1, 'second');
const stateB2 = join(stateB1, deltaB2);
const deltaB3 = add(stateB2, 'third');
const stateB3 = join(stateB2, deltaB3);
const deltaB4 = rem(stateB3, 'first');
const stateB4 = join(stateB3, deltaB4);
console.log({ deltaB1, stateB1, deltaB2, stateB2, deltaB3, stateB3 });

console.log(`A before join: `, value(stateA4));
console.log(`B before join: `, value(stateB4));

console.log('Exchange deltas');
const stateA5 = join(stateA4, deltaB1);
const stateA6 = join(stateA5, deltaB2);
const stateA7 = join(stateA6, deltaB3);
const stateA8 = join(stateA7, deltaB4);
const stateB5 = join(stateB4, deltaA1);
const stateB6 = join(stateB5, deltaA2);
const stateB7 = join(stateB6, deltaA3);

console.log('State after join');
console.log({ stateA8, stateB7 });
console.log(`A after join: `, value(stateA8));
console.log(`B after join: `, value(stateB7));

