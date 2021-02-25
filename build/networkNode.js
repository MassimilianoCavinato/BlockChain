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
        this.id = uuid_1.v4();
        this.blockChain = new blockchain_1.BlockChain();
        localtunnel({ port: port })
            .then(tunnel => {
            this.blockChain.localNodeUrl = tunnel.url;
            const server = express();
            server.use(bodyParser.json());
            server.use(bodyParser.urlencoded({ extended: false }));
            server.get('/blockchain', (req, res) => this.getBlockChain(req, res));
            server.post('/transaction', (req, res) => this.createTransaction(req, res));
            server.get('/mine', (req, res) => this.mine(req, res));
            server.post('/register-and-broadcast-node', (req, res) => this.registerAndBroadcastNode(req, res));
            server.post('/register-node', (req, res) => this.registerNode(req, res));
            server.post('/register-nodes-bulk', (req, res) => this.registerNodesBulk(req, res));
            server.listen(port, () => console.log("Network Node running @", this.blockChain.localNodeUrl));
        })
            .catch(error => {
            console.log("Unabelo to start network node tunnel");
        });
    }
    getBlockChain(req, res) {
        res.json(this.blockChain);
    }
    createTransaction(req, res) {
        const amount = req.body.amount;
        const sender = req.body.sender;
        const recipient = req.body.recipient;
        const blockIndex = this.blockChain.createNewTransaction(amount, sender, recipient);
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
        res.json({ message: "New block mined succesfully", block: newBlock });
    }
    registerAndBroadcastNode(req, res) {
        const newNodeUrl = req.body.newNodeUrl;
        if (this.blockChain.networkNodes.indexOf(newNodeUrl) === -1 && newNodeUrl != this.blockChain.localNodeUrl) {
            this.blockChain.networkNodes.push(newNodeUrl);
        }
        const regNodesPromises = this.blockChain.networkNodes.map(networkNodeUrl => rp({
            "uri": networkNodeUrl + "/register-node",
            "method": "post",
            "body": { "newNodeUrl": newNodeUrl },
            "json": true
        }));
        Promise.all(regNodesPromises)
            .then(data => rp({
            "uri": newNodeUrl + "/register-nodes-bulk",
            "method": "post",
            "body": { "allNetworkNodes": [...this.blockChain.networkNodes, this.blockChain.localNodeUrl] },
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
        if (this.blockChain.networkNodes.indexOf(newNodeUrl) === -1 && newNodeUrl != this.blockChain.localNodeUrl) {
            this.blockChain.networkNodes.push(newNodeUrl);
        }
        res.json({ message: "Node " + newNodeUrl + " registered" });
    }
    registerNodesBulk(req, res) {
        const allNetworkNodes = req.body.allNetworkNodes;
        let new_registered_nodes = 0;
        allNetworkNodes.forEach(networkNodeUrl => {
            if (this.blockChain.networkNodes.indexOf(networkNodeUrl) === -1 && networkNodeUrl != this.blockChain.localNodeUrl) {
                this.blockChain.networkNodes.push(networkNodeUrl);
                new_registered_nodes++;
            }
        });
        res.json({ message: "Node bulk registration succesfull, " + new_registered_nodes + " new nodes added to local network" });
    }
}
exports.NetworkNode = NetworkNode;
//# sourceMappingURL=networkNode.js.map