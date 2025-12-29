'use strict';

const init = () => new Map();

const value = (state) => {
    const values = Array.from(state.values());
    return values.reduce((acc, { pc, nc }) => acc + pc - nc, 0);
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
        const { pc: pc1 = 0, nc: nc1 = 0 } = state1.get(key) || {};
        const { pc: pc2 = 0, nc: nc2 = 0 } = state2.get(key) || {};
        result.set(key, { pc: Math.max(pc1, pc2), nc: Math.max(nc1, nc2) });
    }
    return result;
};

const inc = (id, state, value = 1) => {
    const delta = new Map();
    const { pc = 0, nc = 0 } = state.get(id) || {};
    const updated = { pc: pc + value, nc };
    delta.set(id, updated);
    state.set(id, updated);
    return delta;
};

const dec = (id, state, value = 1) => {
    const delta = new Map();
    const { pc = 0, nc = 0 } = state.get(id) || {};
    const updated = { pc, nc: nc + value }; 
    delta.set(id, updated);
    state.set(id, updated);
    return delta;
};

// Usage

console.log('Replica A');
const stateA = init();
const deltaA1 = inc('A', stateA);
const stateA2 = join(stateA, deltaA1);
const deltaA2 = inc('A', stateA2);
const stateA3 = join(stateA2, deltaA2);
const deltaA3 = dec('A', stateA3);
const stateA4 = join(stateA3, deltaA3);
console.log({ deltaA1, stateA2, deltaA2, stateA3, deltaA3, stateA4 });

console.log('Replica B');
const stateB = init();
const deltaB1 = inc('B', stateB);
const stateB1 = join(stateB, deltaB1);
console.log({ deltaB1, stateB1 });

console.log(`A before join: ${value(stateA4)}`);
console.log(`B before join: ${value(stateB1)}`);

console.log('Exchange deltas');
const stateA5 = join(stateA4, deltaB1);
const stateB2 = join(stateB1, deltaA1);
const stateB3 = join(stateB2, deltaA2);
const stateB4 = join(stateB2, deltaA3);

console.log('State after join');
console.log({ stateA5, stateB4 });
console.log(`A after join: ${value(stateA5)}`);
console.log(`B after join: ${value(stateB4)}`);
