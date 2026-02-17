const toArray = (value) => Array.isArray(value) ? value : [value];

class DeltaGCounter {
    #result;

    constructor(initialValue = 0) {
        this.#result = initialValue;
    }

    value() {
        return this.#result;
    }

    increment(value = 1) {
        this.#result += value;
        return value;
    }

    applyDelta(delta) {
        this.#result += delta;
    }
}

// Usage

console.log('Replica A');
const deltaGCounterA = new DeltaGCounter();
const deltaA1 = deltaGCounterA.increment(5);
const deltaA2 = deltaGCounterA.increment(2);
const deltaA3 = deltaGCounterA.increment(3);
console.log({ deltaGCounterA, deltaA1, deltaA2, deltaA3 });

console.log('Replica B');
const deltaGCounterB = new DeltaGCounter();
const deltaB1 = deltaGCounterB.increment(12);
const deltaB2 = deltaGCounterB.increment(1);
console.log({ deltaGCounterB, deltaB1, deltaB2 });

console.log(`A before join: ${deltaGCounterA.value()}`);
console.log(`B before join: ${deltaGCounterB.value()}`);

console.log('Exchange deltas');
deltaGCounterA.applyDelta(deltaB1);
deltaGCounterA.applyDelta(deltaB2);
deltaGCounterB.applyDelta(deltaA1);
deltaGCounterB.applyDelta(deltaA2);
deltaGCounterB.applyDelta(deltaA3);

console.log('State after join');
console.log({ deltaGCounterA, deltaGCounterB });
console.log(`A after join: ${deltaGCounterA.value()}`);
console.log(`B after join: ${deltaGCounterB.value()}`);