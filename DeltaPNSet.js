const toArray = (value) => Array.isArray(value) ? value : [value];

class DeltaPNSet {
    #removed;
    #added;

    constructor({ added = new Map(), removed = new Map() } = {}) {
        this.#added = added;
        this.#removed = removed;
    }

    value() {
        const result = new Set();
        for (const [value, addedCount] of this.#added.entries()) {
            const removedCount = this.#removed.get(value) || 0;
            if (addedCount > removedCount) result.add(value)
        }
        return result;
    }

    add(value) {
        const delta = toArray(value).reduce((delta, value) => {
            const addedCount = this.#added.get(value) || 0;
            this.#added.set(value, addedCount + 1);
            delta.set(value, 1);
            return delta;
        }, new Map());
        return [delta, null];
    }

    remove(value) {
        const delta = toArray(value).reduce((delta, value) => {
            const removedCount = this.#removed.get(value) || 0;
            this.#removed.set(value, removedCount + 1);
            delta.set(value, 1);
            return delta;
        }, new Map());
        return [null, delta];
    }

    applyDelta([addedDelta, removedDelta]) {
        const addedEntries = (addedDelta || new Map()).entries();
        const removedEntries = (removedDelta || new Map()).entries();

        for (const [value, count] of addedEntries) {
            const currentCount = this.#added.get(value) || 0;
            this.#added.set(value, currentCount + count);
        }

        for (const [value, count] of removedEntries) {
            const currentCount = this.#removed.get(value) || 0;
            this.#removed.set(value, currentCount + count);
        }
    }
}

// Usage

console.log('Replica A');
const deltaPNSetA = new DeltaPNSet();
const deltaA1 = deltaPNSetA.add('first');
const deltaA2 = deltaPNSetA.add('second');
const deltaA3 = deltaPNSetA.remove('first');
console.dir({ deltaPNSetA, deltaA1, deltaA2, deltaA3 });

console.log('Replica B');
const deltaPNSetB = new DeltaPNSet();
const deltaB1 = deltaPNSetB.add('first');
const deltaB2 = deltaPNSetB.add('second');
const deltaB3 = deltaPNSetB.add('third');
const deltaB4 = deltaPNSetB.remove('first');
console.log({ deltaPNSetB, deltaB1, deltaB2, deltaB3, deltaB4 });

console.log(`A before join: `, deltaPNSetA.value());
console.log(`B before join: `, deltaPNSetB.value());

console.log('Exchange deltas');
deltaPNSetA.applyDelta(deltaB1);
deltaPNSetA.applyDelta(deltaB2);
deltaPNSetA.applyDelta(deltaB3);
deltaPNSetA.applyDelta(deltaB4);
deltaPNSetB.applyDelta(deltaA1);
deltaPNSetB.applyDelta(deltaA2);
deltaPNSetB.applyDelta(deltaA3);

console.log('State after join');
console.log({ deltaPNSetA, deltaPNSetB });
console.log(`A after join: `, deltaPNSetA.value());
console.log(`B after join: `, deltaPNSetB.value());