"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkNode = void 0;
const localtunnel = require("localtunnel");
const express = require("express");
const bodyParser = require("body-parser");
const rp = require("request-promise");
const uuid_1 = require("uuid");
const blockchain_1 = require("./blockchain");
class NetworkNode {
    constructor(port) {
        const server = express();
        server.use(bodyParser.json());
        server.use(bodyParser.urlencoded({ extended: false }));
        this.id = uuid_1.v4().replace(/-/g, '');
        this.blockChain = new blockchain_1.BlockChain();
        localtunnel({ port: port })
            .then(tunnel => {
            this.url = tunnel.url;
            this.blockChain.localNodeUrl = this.url;
            server.get('/blockchain', (req, res) => this.getBlockChain(req, res));
            server.post('/transaction', (req, res) => this.createTransaction(req, res));
            server.post('/transaction/broadcast', (req, res) => this.createTransactionAndBroadCast(req, res));
            server.get('/mine', (req, res) => this.mine(req, res));
            server.post('/receive-new-block', (req, res) => this.receiveNewBlock(req, res));
            server.post('/register-and-broadcast-node', (req, res) => this.registerAndBroadcastNode(req, res));
            server.post('/register-node', (req, res) => this.registerNode(req, res));
            server.post('/register-nodes-bulk', (req, res) => this.registerNodesBulk(req, res));
            server.get('/consensus', (req, res) => this.getConsensus(req, res));
            server.get('/transactions/:transaction_id', (req, res) => this.getTransactionByTransactionId(req, res));
            server.get('/blocks/:block_hash', (req, res) => this.getBlockByBlockHash(req, res));
            server.get('/addresses/:address_id', (req, res) => this.getAddressByAddressId(req, res));
            server.listen(port, () => console.log("Network Node running @", this.url));
        })
            .catch(error => {
            console.log("Unable to start network node tunnel");
        });
    }
    getBlockChain(req, res) {
        res.json(this.blockChain);
    }
    registerAndBroadcastNode(req, res) {
        const newNodeUrl = req.body.newNodeUrl;
        if (this.blockChain.networkNodes.indexOf(newNodeUrl) === -1 && newNodeUrl != this.url) {
            this.blockChain.networkNodes.push(newNodeUrl);
        }
        const promises = this.blockChain.networkNodes.map(networkNodeUrl => rp({
            "uri": networkNodeUrl + "/register-node",
            "method": "post",
            "body": { "newNodeUrl": newNodeUrl },
            "json": true
        }));
        Promise.all(promises)
            .then(data => rp({
            "uri": newNodeUrl + "/register-nodes-bulk",
            "method": "post",
            "body": { "allNetworkNodes": [...this.blockChain.networkNodes, this.url] },
            "json": true
        }))
            .then(data => {
            res.json({ message: "Node registered with network succesfully" });
        })
            .catch(error => {
            console.log(error);
        });
    }
    registerNode(req, res) {
        const newNodeUrl = req.body.newNodeUrl;
        if (this.blockChain.networkNodes.indexOf(newNodeUrl) === -1 && newNodeUrl != this.url) {
            this.blockChain.networkNodes.push(newNodeUrl);
        }
        res.json({ message: "Node " + newNodeUrl + " registered" });
    }
    registerNodesBulk(req, res) {
        const allNetworkNodes = req.body.allNetworkNodes;
        let new_registered_nodes = 0;
        allNetworkNodes.forEach(networkNodeUrl => {
            if (this.blockChain.networkNodes.indexOf(networkNodeUrl) === -1 && networkNodeUrl != this.url) {
                this.blockChain.networkNodes.push(networkNodeUrl);
                new_registered_nodes++;
            }
        });
        res.json({ message: "Node bulk registration succesfull, " + new_registered_nodes + " new nodes added to local network" });
    }
    createTransactionAndBroadCast(req, res) {
        const amount = req.body.amount;
        const sender = req.body.sender;
        const recipient = req.body.recipient;
        const message = req.body.message || "";
        const transaction = this.blockChain.createNewTransaction(amount, sender, recipient, message);
        const blockIndex = this.blockChain.addTransactionToPendingTransactions(transaction);
        const promises = this.blockChain.networkNodes.map(nodeUrl => {
            return rp({
                "uri": nodeUrl + "/transaction",
                "method": "post",
                "body": { "transaction": transaction },
                "json": true
            });
        });
        Promise.all(promises)
            .then(data => {
            res.json({ message: `Transaction will be added in block ${blockIndex}` });
        })
            .catch(error => {
            console.log(error);
        });
    }
    createTransaction(req, res) {
        const transaction = req.body.transaction;
        const blockIndex = this.blockChain.addTransactionToPendingTransactions(transaction);
        console.log(this.url, transaction.id, blockIndex);
        res.json({ message: `Transaction will be added in block ${blockIndex}` });
    }
    mine(req, res) {
        const previousBlock = this.blockChain.getLastBlock();
        const previousBlockHash = previousBlock['hash'];
        const currentBlockData = {
            index: previousBlock['index'] + 1,
            transactions: this.blockChain.pendingTransactions,
        };
        const nonce = this.blockChain.proofOfWork(previousBlockHash, currentBlockData);
        const hash = this.blockChain.hashBlock(previousBlockHash, currentBlockData, nonce);
        const newBlock = this.blockChain.createNewBlock(nonce, previousBlockHash, hash);
        const promises = this.blockChain.networkNodes.map(nodeUrl => {
            return rp({
                "uri": nodeUrl + "/receive-new-block",
                "method": "post",
                "body": { "block": newBlock },
                "json": true
            });
        });
        Promise.all(promises)
            .then(data => {
            const rewardTransaction = this.blockChain.getRewardTransaction(this.id);
            return rp({
                "uri": this.url + "/transaction/broadcast",
                "method": "post",
                "body": rewardTransaction,
                "json": true
            });
        })
            .then(data => {
            res.json({ message: "New block mined succesfully", block: newBlock });
        })
            .catch(error => {
            console.log(error);
        });
    }
    receiveNewBlock(req, res) {
        const block = req.body.block;
        const newBlockIsValid = this.blockChain.checkNewBlockValidity(block);
        if (newBlockIsValid) {
            this.blockChain.chain.push(block);
            this.blockChain.pendingTransactions = [];
            res.json({
                "message": "New block accepted",
                "block": block
            });
        }
        else {
            res.json({
                "message": "New block rejected",
                "block": block
            });
        }
    }
    getConsensus(req, res) {
        const promises = this.blockChain.networkNodes.map(nodeUrl => {
            return rp({
                "uri": nodeUrl + "/blockchain",
                "method": "get",
                "json": true
            });
        });
        Promise.all(promises)
            .then(blockchains => {
            const currentChainLength = this.blockChain.chain.length;
            let maxChainLength = currentChainLength;
            let newLongestChain = null;
            let newPendingTransactions = null;
            blockchains.forEach(bc => {
                if (bc.chain.length > maxChainLength) {
                    maxChainLength = bc.chain.length;
                    newLongestChain = bc.chain;
                    newPendingTransactions = bc.pendingTransactions;
                }
            });
            if (!newLongestChain || (newLongestChain && !this.blockChain.chainIsValid(newLongestChain))) {
                res.json({
                    "message": "Current chain has not been replaced.",
                    "chain": this.blockChain.chain
                });
            }
            else {
                this.blockChain.chain = newLongestChain;
                this.blockChain.pendingTransactions = newPendingTransactions;
                res.json({
                    "message": "Current chain has been replaced.",
                    "chain": this.blockChain.chain
                });
            }
        });
    }
    getTransactionByTransactionId(req, res) {
        const transaction_id = req.params.transaction_id;
    }
    getBlockByBlockHash(req, res) {
        const block_hash = req.params.block_hash;
    }
    getAddressByAddressId(req, res) {
        const address_id = req.params.address_id;
    }
}
exports.NetworkNode = NetworkNode;
//# sourceMappingURL=networkNode.js.map