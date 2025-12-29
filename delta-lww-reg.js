'use strict';

const init = () => ({ timestamp: 0, value: undefined });

const value = (state) => {
    return state.value;
};

const join = (state1, state2) => {
    return state1.timestamp > state2.timestamp ? state1 : state2;
};

const write = (state, value) => {
    state = { timestamp: Date.now(), value }
    return state;
};

// Usage

console.log('Replica A');
const stateA = init();
const deltaA1 = write(stateA, 'first');
const stateA2 = join(stateA, deltaA1);
const deltaA2 = write(stateA2, 'second');
const stateA3 = join(stateA2, deltaA2);
console.log({ deltaA1, stateA2, deltaA2, stateA3 });

console.log('Replica B');
const stateB = init();
const deltaB1 = write(stateB, 'third');
const stateB1 = join(stateB, deltaB1);
console.log({ deltaB1, stateB1 });

console.log(`A before join: `, value(stateA3));
console.log(`B before join: `, value(stateB1));

console.log('Exchange deltas');
const stateA4 = join(stateA3, deltaB1);
const stateB2 = join(stateB1, deltaA1);
const stateB3 = join(stateB2, deltaA2);

console.log('State after join');
console.log({ stateA4, stateB3 });
console.log(`A after join: `, value(stateA4));
console.log(`B after join: `, value(stateA4));
