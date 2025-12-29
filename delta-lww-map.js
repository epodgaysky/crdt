'use strict';

const init = () => ({ map: new Map(), added: new Map(), removed: new Map() });

const value = ({ map, added, removed }) => {
  const result = new Map();
  for (const [key, value] of map.entries()) {
    const addedTimestamp = added.get(key) || 0;
    const removedTimestamp = removed.get(key) || 0;
    if (addedTimestamp > removedTimestamp) result.set(key, value);
  }
  return result
}

const add = (state, key, value, timestamp = Date.now()) => {
  const delta = { map: new Map(), added: new Map(), removed: new Map() };
  const prev = state.added.get(key) || 0;
  if (timestamp > prev) {
    state.added.set(key, timestamp);
    state.map.set(key, value);
    delta.added.set(key, timestamp);
    delta.map.set(key, value);
  }
  return delta;
};

const rem = (state, key, timestamp = Date.now()) => {
  const delta = { map: new Map(), added: new Map(), removed: new Map() };
  const prev = state.removed.get(key) || 0;
  if (timestamp > prev) {
    state.removed.set(key, timestamp);
    delta.removed.set(key, timestamp);
  }
  return delta;
};

const keysUnion = (state1, state2) => {
  const keys = new Set();
  for (const key of state1.keys()) keys.add(key);
  for (const key of state2.keys()) keys.add(key);
  return keys;
};

const mergeTimestampsMaps = (map1, map2) => {
  const result = new Map();
  for (const value of keysUnion(map1, map2)) {
    const map1Timestamp = map1.get(value) || 0;
    const map2Timestamp = map2.get(value) || 0;
    result.set(value, Math.max(map1Timestamp, map2Timestamp));
  }
  return result;
}

const mergeMapsByTimestampsMaps = (map1, map2, timestampMap1, timestampMap2) => {
  const resultMap = new Map(map1);
  for (const [key, value] of map2.entries()) {
    const added1Timestamp = timestampMap1.get(key) || 0;
    const added2Timestamp = timestampMap2.get(key) || 0;
    if (added2Timestamp > added1Timestamp) resultMap.set(key, value);
  }
  return resultMap;
}

const join = (state1, state2) => {
  const { map: map1, added: added1 = new Map(), removed: removed1 = new Map() } = state1;
  const { map: map2, added: added2 = new Map(), removed: removed2 = new Map() } = state2;
  return {
    map: mergeMapsByTimestampsMaps(map1, map2, added1, added2),
    added: mergeTimestampsMaps(added1, added2),
    removed: mergeTimestampsMaps(removed1, removed2)
  }
}

// Usage

console.log('Replica A');
const stateA = init();
const deltaA1 = add(stateA, 'first', [1,2,3]);
const stateA2 = join(stateA, deltaA1);
const deltaA2 = add(stateA2, 'second', [1,2,3]);
const stateA3 = join(stateA2, deltaA2);
const deltaA3 = rem(stateA3, 'second');
const stateA4 = join(stateA3, deltaA3);
console.log({ deltaA1, stateA2, deltaA2, stateA3, deltaA3, stateA4 });

console.log('Replica B');
const stateB = init();
const deltaB1 = add(stateB, 'first', [2,3,4]);
const stateB1 = join(stateB, deltaB1);
const deltaB2 = add(stateB1, 'second', [2,3,4]);
const stateB2 = join(stateB1, deltaB2);
const deltaB3 = add(stateB2, 'third', [1,2,3]);
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

