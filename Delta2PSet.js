const toArray = (value) => Array.isArray(value) ? value : [value];

class Delta2PSet {
    #removed;
    #added;

    constructor({ added = new Set(), removed = new Set() } = {}) {
        this.#added = added;
        this.#removed = removed;
    }

    value() {
        const result = new Set();
        for (const value of this.#added) {
            if (!this.#removed.has(value)) result.add(value)
        }
        return result;
    }

    add(value) {
        const delta = toArray(value).reduce((delta, value) => {
            if (!this.#added.has(value)) {
                this.#added.add(value)
                delta.add(value);
            }
            return delta
        }, new Set());

        return [delta, null];
    }

    remove(value) {
        const delta = toArray(value).reduce((delta, value) => {
            if (!this.#removed.has(value)) {
                this.#removed.add(value)
                delta.add(value);
            }
            return delta
        }, new Set());

        return [null, delta]
    }

    applyDelta([addedDelta, removedDelta]) {
        for (const value of addedDelta || new Set()) {
            this.#added.add(value)
        }

        for (const value of removedDelta || new Set()) {
            this.#removed.add(value)
        }
    }
}

// Usage

console.log('Replica A');
const deltaSetA = new Delta2PSet();
const deltaA1 = deltaSetA.add('first');
const deltaA2 = deltaSetA.add('second');
const deltaA3 = deltaSetA.remove('first');
console.log({ deltaSetA, deltaA1, deltaA2, deltaA3 });

console.log('Replica B');
const deltaSetB = new Delta2PSet();
const deltaB1 = deltaSetB.add('first');
const deltaB2 = deltaSetB.add('second');
const deltaB3 = deltaSetB.add('third');
const deltaB4 = deltaSetB.remove('second');
console.log({ deltaSetB, deltaB1, deltaB2, deltaB3, deltaB4 });

console.log(`A before join: `, deltaSetA.value());
console.log(`B before join: `, deltaSetB.value());

console.log('Exchange deltas');
deltaSetA.applyDelta(deltaB1);
deltaSetA.applyDelta(deltaB2);
deltaSetA.applyDelta(deltaB3);
deltaSetA.applyDelta(deltaB4);
deltaSetB.applyDelta(deltaA1);
deltaSetB.applyDelta(deltaA2);
deltaSetB.applyDelta(deltaA3);

console.log('State after join');
console.log({ deltaSetA, deltaSetB });
console.log(`A after join: `, deltaSetA.value());
console.log(`B after join: `, deltaSetB.value());