// prototype changes
declare global {
    interface Array<T> {
        getRandomElement(): T;

        shuffle(): T[];
    }
    interface ReadonlyArray<T> {
        getRandomElement(): T;

        shuffle(): T[];
    }
}
Array.prototype.getRandomElement = function <T>(): T {
    return this[Math.floor(Math.random() * this.length)];
};
Array.prototype.shuffle = function <T>(): T[] {
    return this.sort(() => Math.floor(Math.random() * 3) - 1);
};

// prototype changes
declare global {
    interface Math {
        random(range?: [number, number] | undefined): number;
    }
}
const oldRandom = Math.random;
Math.random = function (range?: [number, number] | undefined): number {
    return range !== undefined
        ? range[0] + this.floor(oldRandom() * (range[1] - range[0] + 1))
        : oldRandom();
};

export {};
