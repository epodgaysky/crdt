'use strict';

const init = () => new Map();

const value = (state) => {
    const result = new Set();
    for (const replicaSet of state.values()) {
        for (const value of replicaSet) result.add(value)
    }
    return result
};

const keysUnion = (state1, state2) => {
    const keys = new Set();
    for (const key of state1.keys()) keys.add(key);
    for (const key of state2.keys()) keys.add(key);
    return keys;
};

const join = (state1, state2) => {
    const result = new Map();
    for (const key of keysUnion(state1, state2)) {
        const state1Set = state1.get(key) || new Set();
        const state2Set = state2.get(key) || new Set();
        const resultSet = new Set(state1Set);
        for (const value of state2Set) resultSet.add(value)
        result.set(key, resultSet);
    }
    return result;
};

const add = (id, state, value) => {
    const delta = new Map();
    const replicaSet = state.get(id);
    if (!replicaSet || !replicaSet.has(value)) {
        state.set(id, new Set(replicaSet).add(value))
        delta.set(id, new Set([value]));
    }
    return delta;
};

// Usage

console.log('Replica A');
const stateA = init();
const deltaA1 = add('A', stateA, 1);
const stateA2 = join(stateA, deltaA1);
const deltaA2 = add('A', stateA2, 2);
const stateA3 = join(stateA2, deltaA2);
const deltaA3 = add('A', stateA3, 3);
const stateA4 = join(stateA3, deltaA3);
console.log({ deltaA1, stateA2, deltaA2, stateA3, deltaA3, stateA4 });

console.log('Replica B');
const stateB = init();
const deltaB1 = add('B', stateB, 3);
const stateB1 = join(stateB, deltaB1);
const deltaB2 = add('B', stateB1, 4);
const stateB2 = join(stateB1, deltaB2);
console.log({ deltaB1, stateB1, deltaB2, stateB2 });

console.log(`A before join: `, value(stateA4));
console.log(`B before join: `, value(stateB1));

console.log('Exchange deltas');
const stateA5 = join(stateA4, deltaB1);
const stateA6 = join(stateA5, deltaB2);
const stateB3 = join(stateB2, deltaA1);
const stateB4 = join(stateB3, deltaA2);
const stateB5 = join(stateB4, deltaA3);

console.log('State after join');
console.log({ stateA6, stateB5 });
console.log(`A after join: `, value(stateA6));
console.log(`B after join: `, value(stateB5));
