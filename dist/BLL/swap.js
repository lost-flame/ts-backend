"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swap = (a, b) => {
    let temp = a;
    a = b;
    b = temp;
    return { a, b };
};
exports.default = swap;
