"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockChain = void 0;
const sha256 = require("sha256");
const uuid_1 = require("uuid");
class BlockChain {
    constructor() {
        this.reward = 1;
        this.difficulty = 2;
        this.chain = [];
        this.networkNodes = [];
        this.pendingTransactions = [];
        //GENESIS BLOCK       
        this.createNewBlock(0, "0", "0");
    }
    createNewBlock(nonce, previousBlockHash, hash) {
        const block = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: [],
            nonce: nonce,
            hash: hash,
            previousBlockHash: previousBlockHash
        };
        this.pendingTransactions = [];
        this.chain.push(block);
        return block;
    }
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }
    createNewTransaction(amount, sender, recipient, message) {
        const transaction = {
            id: uuid_1.v4().replace(/-/g, ''),
            amount: amount,
            sender: sender,
            recipient: recipient,
            message: message,
        };
        return transaction;
    }
    addTransactionToPendingTransactions(transaction) {
        this.pendingTransactions.push(transaction);
        return this.getLastBlock()['index'];
    }
    hashBlock(previousBlockHash, currentBlockData, nonce) {
        const dataString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash = sha256(dataString);
        return hash;
    }
    proofOfWork(previousBlockHash, currentBlockData) {
        //repeatedly hash using "random seed" until first n characters in sha56 are all 0
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        while (hash.substring(0, this.difficulty) !== "0".repeat(this.difficulty)) {
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        }
        return nonce;
    }
    getRewardTransaction(nodeId) {
        const rewardTransaction = {
            id: uuid_1.v4().replace(/-/g, ''),
            amount: this.reward,
            sender: "0",
            recipient: nodeId,
            message: "Mining reward.",
        };
        return rewardTransaction;
    }
    checkNewBlockValidity(newBlock) {
        const lastBlock = this.getLastBlock();
        const correctHash = lastBlock["hash"] === newBlock["previousBlockHash"];
        const correctIndex = lastBlock["index"] + 1 === newBlock["index"];
        return correctHash && correctIndex;
    }
    chainIsValid(chain) {
        for (var i = 1; i < chain.length; i++) {
            const currentBlock = chain[i];
            const prevBlock = chain[i - 1];
            const currentBlockData = {
                "transactions": currentBlock["transactions"],
                "index": currentBlock["index"]
            };
            const blockHash = this.hashBlock(prevBlock["hash"], currentBlockData, currentBlock["nonce"]);
            if (blockHash.substring(0, this.difficulty) !== "0".repeat(this.difficulty))
                return false;
            if (chain[i]["previousBlockHash"] !== chain[i - 1]["hash"])
                return false;
        }
        //check genesis block
        const genesisBlock = chain[0];
        if (genesisBlock["nonce"] !== 0)
            return false;
        if (genesisBlock["previousHash"] !== "0")
            return false;
        if (genesisBlock["hash"] !== "0")
            return false;
        if (genesisBlock["transactions"].length !== 0)
            return false;
        return true;
    }
}
exports.BlockChain = BlockChain;
//# sourceMappingURL=blockchain.js.map