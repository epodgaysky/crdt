'use strict';

const init = () => new Map();

const value = (state) => {
    const removedSet = new Set();
    const result = new Set();
    for (const { removed } of state.values()) {
        for (const value of removed) removedSet.add(value);
    }
    for (const { added } of state.values()) {
        for (const value of added) {
            if (!removedSet.has(value)) result.add(value);
        }
    }
    return result
};

const keysUnion = (state1, state2) => {
    const keys = new Set();
    for (const key of state1.keys()) keys.add(key);
    for (const key of state2.keys()) keys.add(key);
    return keys;
};

const mergeSets = (set1, set2) => {
    const resultSet = new Set(set1);
    for (const value of set2) resultSet.add(value);
    return resultSet;
}

const join = (state1, state2) => {
    const result = new Map();
    for (const key of keysUnion(state1, state2)) {
        const { added: state1Added = new Set(), removed: state1Removed = new Set() } = state1.get(key) || {};
        const { added: state2Added = new Set(), removed: state2Removed = new Set() } = state2.get(key) || {};
        result.set(key, { added: mergeSets(state1Added, state2Added), removed: mergeSets(state1Removed, state2Removed) });
    }
    return result;
};

const add = (id, state, value) => {
    const delta = new Map();
    const { added, removed } = state.get(id) || {};
    if (!added || !added.has(value)) {
        state.set(id, { added: new Set(added).add(value), removed: new Set(removed) })
        delta.set(id, { added: new Set([value]), removed: new Set() })
    }
    return delta;
};

const rem = (id, state, value) => {
    const delta = new Map();
    const { added, removed } = state.get(id) || {};
    if (!removed || !removed.has(value)) {
        state.set(id, { added: new Set(added), removed: new Set(removed).add(value) })
        delta.set(id, { added: new Set(), removed: new Set([value]) })
    }
    return delta;
};

// Usage

console.log('Replica A');
const stateA = init();
const deltaA1 = add('A', stateA, 'first');
const stateA2 = join(stateA, deltaA1);
const deltaA2 = add('A', stateA2, 'second');
const stateA3 = join(stateA2, deltaA2);
const deltaA3 = rem('A', stateA3, 'first');
const stateA4 = join(stateA3, deltaA3);
console.log({ deltaA1, stateA2, deltaA2, stateA3, deltaA3, stateA4 });

console.log('Replica B');
const stateB = init();
const deltaB1 = add('B', stateB, 'first');
const stateB1 = join(stateB, deltaB1);
const deltaB2 = add('B', stateB1, 'second');
const stateB2 = join(stateB1, deltaB2);
const deltaB3 = add('B', stateB2, 'third');
const stateB3 = join(stateB2, deltaB3);
const deltaB4 = rem('B', stateB3, 'second');
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