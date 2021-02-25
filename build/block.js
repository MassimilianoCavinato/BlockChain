"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
class Block {
    constructor(index, transactions, nonce, hash, previousBlockHash) {
        this.index = index;
        this.timestamp = Date.now();
        this.transactions = transactions;
        this.nonce = nonce;
        this.hash = hash;
        this.previousBlockHash = previousBlockHash;
    }
}
exports.Block = Block;
//# sourceMappingURL=block.js.map