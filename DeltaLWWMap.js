class DeltaLWWMap {
    #removed;
    #added;

    constructor({ added = new Map(), removed = new Map() } = {}) {
        this.#added = added;
        this.#removed = removed;
    }

    value() {
        const result = new Map();
        for (const [key, { value, timestamp }] of this.#added.entries()) {
            const removedTimestamp = this.#removed.get(key) || 0;
            if (timestamp > removedTimestamp) result.set(key, value)
        }
        return result;
    }

    set(key, value, timestamp = Date.now()) {
        const delta = new Map();
        const { timestamp: addedTimestamp } = this.#added.get(key) || 0;
        if (timestamp > addedTimestamp) {
            this.#added.set(key, { value, timestamp });
            delta.set(key, {value, timestamp});
        }
        return [delta, null];
    }

    delete(key, timestamp = Date.now()) {
        const delta = new Map();
        const removedTimestamp = this.#removed.get(key) || 0;
        if (timestamp > removedTimestamp) {
            this.#removed.set(key, timestamp);
            delta.set(key, timestamp);
        }
        return [null, delta];
    }

    applyDelta([addedDelta, removedDelta]) {
        const addedEntries = (addedDelta || new Map()).entries();
        const removedEntries = (removedDelta || new Map()).entries();

        for (const [key, { timestamp: deltaTimestamp, value }] of addedEntries) {
            const { timestamp: currentTimestamp = 0 } = this.#added.get(key) || {};
            if (deltaTimestamp > currentTimestamp) this.#added.set(key, { timestamp: deltaTimestamp, value });
        }

        for (const [key, deltaTimestamp] of removedEntries) {
            const currentTimestamp = this.#removed.get(key) || 0;
            if (deltaTimestamp > currentTimestamp) this.#removed.set(key, deltaTimestamp);
        }
    }
}

// Usage

console.log('Replica A');
const deltaLWWMapA = new DeltaLWWMap();
const deltaA1 = deltaLWWMapA.set('first', [1,2,3]);
const deltaA2 = deltaLWWMapA.set('second', [1,2,3]);
const deltaA3 = deltaLWWMapA.delete('second');
console.log({ deltaLWWMapA, deltaA1, deltaA2, deltaA3 });

console.log('Replica B');
const deltaLWWMapB = new DeltaLWWMap();
const deltaB1 = deltaLWWMapB.set('first', [2,3,4]);
const deltaB2 = deltaLWWMapB.set('second', [2,3,4]);
const deltaB3 = deltaLWWMapB.set('third', [1,2,3]);
const deltaB4 = deltaLWWMapB.delete('first');
console.log({ deltaLWWMapB, deltaB1, deltaB2, deltaB3, deltaB4 });

console.log(`A before join: `, deltaLWWMapA.value());
console.log(`B before join: `, deltaLWWMapB.value());

console.log('Exchange deltas');
deltaLWWMapA.applyDelta(deltaB1);
deltaLWWMapA.applyDelta(deltaB2);
deltaLWWMapA.applyDelta(deltaB3);
deltaLWWMapA.applyDelta(deltaB4);
deltaLWWMapB.applyDelta(deltaA1);
deltaLWWMapB.applyDelta(deltaA2);
deltaLWWMapB.applyDelta(deltaA3);

console.log('State after join');
console.log({ deltaLWWMapA, deltaLWWMapB });
console.log(`A after join: `, deltaLWWMapA.value());
console.log(`B after join: `, deltaLWWMapB.value());
