const toArray = (value) => Array.isArray(value) ? value : [value];

class DeltaGSet {
    #result = new Set();

    constructor(initialValue = new Set()) {
        this.#result = initialValue;
    }

    value() {
        return new Set(this.#result);
    }

    add(value) {
        return toArray(value).reduce((delta, value) => {
            if (!this.#result.has(value)) {
                this.#result.add(value)
                delta.add(value);
            }
            return delta
        }, new Set());
    }

    applyDelta(delta) {
        for (const value of delta || new Set()) {
            this.#result.add(value);
        }
    }
}

// Usage
const gSetA = new DeltaGSet();
const gSetADelta1 = gSetA.add(5);
const gSetADelta2 = gSetA.add(2);
const gSetB = new DeltaGSet();
const gSetBDelta1 = gSetB.add(4);
const gSetBDelta2 = gSetB.add(9);

gSetA.applyDelta(gSetBDelta1);
gSetA.applyDelta(gSetBDelta2);

gSetB.applyDelta(gSetADelta1);
gSetB.applyDelta(gSetADelta2);

console.log('gSetA value: ', gSetA.value());
console.log('gSetB value: ', gSetB.value());