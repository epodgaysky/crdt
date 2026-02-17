class DeltaORSet {
    #removed;
    #added;

    constructor({ added = new Map(), removed = new Map() } = {}) {
        this.#added = added;
        this.#removed = removed;
    }

    add(value, tag = crypto.randomUUID()) {
        const deltaSet = new Set([tag]);
        const addedItemSet = this.#added.get(value) || new Set();
        addedItemSet.add(tag);
        this.#added.set(value, addedItemSet);
        return [new Map([[value, deltaSet]]), null];
    }

    remove(value) {
        const deltaSet = new Set();
        const addedTagsSet = this.#added.get(value);
        const removedItemSet = this.#removed.get(value) || new Set();
        if (!addedTagsSet) return [null, new Map([[value, deltaSet]])];
        for (const tag of addedTagsSet) {
            if (!removedItemSet.has(tag)) {
                removedItemSet.add(tag);
                deltaSet.add(tag);
            }
        }
        this.#removed.set(value, removedItemSet)
        return [null, new Map([[value, deltaSet]])];
    }

    applyDelta([addedDelta, removedDelta]) {
        const addedEntries = (addedDelta || new Map()).entries();
        const removedEntries = (removedDelta || new Map()).entries();

        for (const [value, deltaSet] of addedEntries) {
            const currentAddedSet = this.#added.get(value) || new Set();
            for (const value of deltaSet) {
                currentAddedSet.add(value);
            }
            this.#added.set(value, currentAddedSet);
        }

        for (const [value, deltaSet] of removedEntries) {
            const currentRemovedSet = this.#removed.get(value) || new Set();
            for (const removedValue of deltaSet) {
                currentRemovedSet.add(removedValue);
            }
            this.#removed.set(value, currentRemovedSet);
        }
    }

    value() {
        const result = new Set();
        for (const [value, addedSet = new Set()] of this.#added.entries()) {
            const removedSet = this.#removed.get(value) || new Set();
            for (const tag of addedSet) {
                if (!removedSet.has(tag)) {
                    result.add(value);
                    break;
                }
            }
        }

        return result;
    }
}

// Usage

console.log('Replica A');
const deltaORSetA = new DeltaORSet();
const deltaA1 = deltaORSetA.add('a');
const deltaA2 = deltaORSetA.add('b');
const deltaA3 = deltaORSetA.remove('a');
console.log({ deltaORSetA, deltaA1, deltaA2, deltaA3 });

console.log('Replica B');
const deltaORSetB = new DeltaORSet();
const deltaB1 = deltaORSetB.add('b');
const deltaB2 = deltaORSetB.add('c');
const deltaB3 = deltaORSetB.remove('b');
console.log({ deltaORSetB, deltaB1, deltaB2, deltaB3 });

console.log(`A before join: `, deltaORSetA.value());
console.log(`B before join: `, deltaORSetB.value());

console.log('Exchange deltas');
deltaORSetA.applyDelta(deltaB1);
deltaORSetA.applyDelta(deltaB2);
deltaORSetA.applyDelta(deltaB3);
deltaORSetB.applyDelta(deltaA1);
deltaORSetB.applyDelta(deltaA2);
deltaORSetB.applyDelta(deltaA3);

console.log('State after join');
console.log({ deltaORSetA, deltaORSetB });
console.log(`A after join: `, deltaORSetA.value());
console.log(`B after join: `, deltaORSetB.value());
