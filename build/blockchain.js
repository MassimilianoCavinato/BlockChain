"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockChain = void 0;
const sha256_1 = require("sha256");
const block_1 = require("./block");
const transaction_1 = require("./transaction");
class BlockChain {
    constructor() {
        this.difficulty = 2;
        this.chain = [];
        this.networkNodes = [];
        this.pendingTransactions = [];
        //GENESIS BLOCK       
        this.createNewBlock(0, "0", "0");
    }
    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = new block_1.Block(this.chain.length + 1, this.pendingTransactions, nonce, hash, previousBlockHash);
        this.pendingTransactions = [];
        this.chain.push(newBlock);
        return newBlock;
    }
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }
    createNewTransaction(amount, sender, recipient) {
        const newTransaction = new transaction_1.Transaction(amount, sender, recipient);
        this.pendingTransactions.push(newTransaction);
        return this.getLastBlock()['index'] + 1;
    }
    hashBlock(previousBlockHash, currentBlockData, nonce) {
        const dataString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash = sha256_1.sha256(dataString);
        return hash;
    }
    proofOfWork(previousBlockHash, currentBlockData) {
        //repeatedly hash using "random seed" until first n characted in sha56 are all 0
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        while (hash.substring(0, this.difficulty) !== "0".repeat(this.difficulty)) {
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        }
        return nonce;
    }
}
exports.BlockChain = BlockChain;
//# sourceMappingURL=blockchain.js.map