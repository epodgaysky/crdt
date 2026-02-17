const toArray = (value) => Array.isArray(value) ? value : [value];

class DeltaPNCounter {
    #added;
    #removed;

    constructor({ added = 0, removed = 0 } = {}) {
        this.#added = added;
        this.#removed = removed;
    }

    value() {
        return this.#added - this.#removed;
    }

    increment(value = 1) {
        this.#added += value;
        return { inc: value };
    }

    decrement(value = 1) {
        this.#removed += value;
        return { dec: value };
    }

    applyDelta({ inc = 0, dec = 0 } = {}) {
        this.#added += inc;
        this.#removed += dec;
    }
}

// Usage

console.log('Replica A');
const deltaPNCounterA = new DeltaPNCounter();
const deltaA1 = deltaPNCounterA.increment(5);
const deltaA2 = deltaPNCounterA.increment(2);
const deltaA3 = deltaPNCounterA.decrement(7);
const deltaA4 = deltaPNCounterA.increment(3);
console.log({ deltaGCounterA: deltaPNCounterA, deltaA1, deltaA2, deltaA3, deltaA4 });

console.log('Replica B');
const deltaPNCounterB = new DeltaPNCounter();
const deltaB1 = deltaPNCounterB.decrement(10);
const deltaB2 = deltaPNCounterB.increment(12);
const deltaB3 = deltaPNCounterB.increment(1);
console.log({ deltaGCounterB: deltaPNCounterB, deltaB1, deltaB2, deltaB3 });

console.log(`A before join: ${deltaPNCounterA.value()}`);
console.log(`B before join: ${deltaPNCounterB.value()}`);

console.log('Exchange deltas');
deltaPNCounterA.applyDelta(deltaB1);
deltaPNCounterA.applyDelta(deltaB2);
deltaPNCounterA.applyDelta(deltaB3);
deltaPNCounterB.applyDelta(deltaA1);
deltaPNCounterB.applyDelta(deltaA2);
deltaPNCounterB.applyDelta(deltaA3);
deltaPNCounterB.applyDelta(deltaA4);

console.log('State after join');
console.log({ deltaPNCounterA, deltaPNCounterB });
console.log(`A after join: ${deltaPNCounterA.value()}`);
console.log(`B after join: ${deltaPNCounterB.value()}`);