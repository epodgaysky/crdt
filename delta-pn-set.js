'use strict';

const init = () => new Map();

const value = (state) => {
    const valuesCounts = new Map();
    const result = new Set();
    for (const replicaSetMap of state.values()) {
        for (const [value, { added, removed }] of replicaSetMap.entries()) {
            const { added: currentAdded = 0, removed: currentRemoved = 0 } = valuesCounts.get(value) || {}
            valuesCounts.set(value, { added: currentAdded + added, removed: currentRemoved + removed });
        }
    }
    for (const [value, { added, removed }] of valuesCounts.entries()) {
        if (added > removed) result.add(value);
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
        const state1CountsMap = state1.get(key) || new Map();
        const state2CountsMap = state2.get(key) || new Map();
        const resultCountsMap = new Map(state1CountsMap);
        for (const [value, { added: state2Added, removed: state2Removed }] of state2CountsMap.entries()) {
            const { added = 0, removed = 0} = resultCountsMap.get(value) || {}
            resultCountsMap.set(value, {
                added: Math.max(added, state2Added),
                removed: Math.max(removed, state2Removed),
            })
        }
        result.set(key, resultCountsMap);
    }
    return result;
};

const add = (id, state, value) => {
    const replicaValues = state.get(id) || new Map();
    const { added = 0, removed = 0 } = replicaValues.get(value) || {};
    const updatedValueCounts = { added: added + 1, removed }
    replicaValues.set(value, updatedValueCounts)
    return new Map([[id, new Map([[value, updatedValueCounts]])]]);
};

const rem = (id, state, value) => {
    const replicaValues = state.get(id) || new Map();
    const { added = 0, removed = 0 } = replicaValues.get(value) || {};
    const updatedValueCounts = { added, removed: removed + 1 }
    replicaValues.set(value, updatedValueCounts)
    return new Map([[id, new Map([[value, updatedValueCounts]])]]);
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
const deltaB4 = rem('B', stateB3, 'first');
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