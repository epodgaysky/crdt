class DeltaLWWReg {
    #value;
    #timestamp;

    constructor(initialValue) {
        this.#value = initialValue;
        this.#timestamp = Date.now();
    }

    value() {
        return this.#value;
    }

    write(value, timestamp = Date.now()) {
        if (timestamp >= this.#timestamp) {
            this.#value = value;
            this.#timestamp = timestamp;
            return { value, timestamp };
        } 
        
        return {};
    }

    applyDelta({ value, timestamp = 0 }) {
        if (timestamp >= this.#timestamp) {
            this.#value = value;
            this.#timestamp = timestamp;
        }
    }
}

// Usage

console.log('Replica A');
const deltaLWWRegA = new DeltaLWWReg();
const deltaA1 = deltaLWWRegA.write('first');
const deltaA2 = deltaLWWRegA.write('second');
console.log({ deltaLWWRegA, deltaA1, deltaA2 });

console.log('Replica B');
const deltaLWWRegB = new DeltaLWWReg();
const deltaB1 = deltaLWWRegB.write('third');
console.log({ deltaLWWRegB, deltaB1 });

console.log(`A before join: `, deltaLWWRegA.value());
console.log(`B before join: `, deltaLWWRegB.value());

console.log('Exchange deltas');
deltaLWWRegA.applyDelta(deltaB1);
deltaLWWRegB.applyDelta(deltaA1);
deltaLWWRegB.applyDelta(deltaA2);

console.log('State after join');
console.log({ deltaLWWRegA, deltaLWWRegB });
console.log(`A after join: `, deltaLWWRegA.value());
console.log(`B after join: `, deltaLWWRegB.value());