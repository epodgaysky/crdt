const toArray = (value) => Array.isArray(value) ? value : [value];

class DeltaLWWSet {
    #removed;
    #added;

    constructor({ added = new Map(), removed = new Map() } = {}) {
        this.#added = added;
        this.#removed = removed;
    }

    value() {
        const result = new Set();
        for (const [value, timestamp] of this.#added.entries()) {
            const removedTimestamp = this.#removed.get(value) || 0;
            if (timestamp > removedTimestamp) result.add(value)
        }
        return result;
    }

    add(value, timestamp = Date.now()) {
        const delta = toArray(value).reduce((delta, value) => {
            const addedTimestamp = this.#added.get(value) || 0;
            if (timestamp > addedTimestamp) {
                this.#added.set(value, timestamp);
                delta.set(value, timestamp);
            }
            return delta;
        }, new Map());
        return [delta, null];
    }

    remove(value, timestamp = Date.now()) {
        const delta = toArray(value).reduce((delta, value) => {
            const removedTimestamp = this.#removed.get(value) || 0;
            if (timestamp > removedTimestamp) {
                this.#removed.set(value, timestamp);
                delta.set(value, timestamp);
            }
            return delta;
        }, new Map());
        return [null, delta];
    }

    applyDelta([addedDelta, removedDelta]) {
        const addedEntries = (addedDelta || new Map()).entries();
        const removedEntries = (removedDelta || new Map()).entries();

        for (const [value, deltaTimestamp] of addedEntries) {
            const currentTimestamp = this.#added.get(value) || 0;
            if (deltaTimestamp > currentTimestamp) this.#added.set(value, deltaTimestamp);
        }

        if (removedDelta) {
            for (const [value, deltaTimestamp] of removedEntries) {
                const currentTimestamp = this.#removed.get(value) || 0;
                if (deltaTimestamp > currentTimestamp) this.#removed.set(value, deltaTimestamp);
            }
        }
    }
}

console.log('Replica A');
const LWWSetA = new DeltaLWWSet();
const deltaA1 = LWWSetA.add('first');
const deltaA2 = LWWSetA.add('second');
const deltaA3 = LWWSetA.remove('second');
console.log({ LWWSetA, deltaA1, deltaA2, deltaA3 });

console.log('Replica B');
const LWWSetB = new DeltaLWWSet();
const deltaB1 = LWWSetB.add('first');
const deltaB2 = LWWSetB.add('second');
const deltaB3 = LWWSetB.add('third');
const deltaB4 = LWWSetB.remove('first');
console.log({ LWWSetB, deltaB1, deltaB2, deltaB3, deltaB4 });

console.log(`A before join: `, LWWSetA.value());
console.log(`B before join: `, LWWSetB.value());

console.log('Exchange deltas');
LWWSetA.applyDelta(deltaB1);
LWWSetA.applyDelta(deltaB2);
LWWSetA.applyDelta(deltaB3);
LWWSetA.applyDelta(deltaB4);
LWWSetB.applyDelta(deltaA1);
LWWSetB.applyDelta(deltaA2);
LWWSetB.applyDelta(deltaA3);

console.log('State after join');
console.log({ LWWSetA, LWWSetB });
console.log(`A after join: `, LWWSetA.value());
console.log(`B after join: `, LWWSetB.value());