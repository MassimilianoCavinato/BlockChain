import * as localtunnel from 'localtunnel';
import * as express  from 'express';
import * as bodyParser from 'body-parser';
import * as rp from 'request-promise';
import { v4 as uuidv4 } from 'uuid';
import { Block, BlockData, Transaction } from './interfaces';
import { BlockChain } from  './blockchain';


export class NetworkNode {

    public id: string;
    public url: string;
    public blockChain: BlockChain;

    constructor(port: number){
        const server = express();
        server.use(bodyParser.json());
        server.use(bodyParser.urlencoded({extended: false}));
        
        this.id =  uuidv4().replace(/-/g, '');
        this.blockChain = new BlockChain();
        
        localtunnel({port: port})
        .then(tunnel => {
            this.url = tunnel.url;
            this.blockChain.localNodeUrl = this.url;
            server.get('/blockchain', (req, res) =>  this.getBlockChain(req, res));
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

    private getBlockChain(req, res) : void {
        res.json(this.blockChain);
    }

    private registerAndBroadcastNode(req, res) : void {
        const newNodeUrl : string = req.body.newNodeUrl;
        if(this.blockChain.networkNodes.indexOf(newNodeUrl) === -1 && newNodeUrl != this.url){
            this.blockChain.networkNodes.push(newNodeUrl);
        }

        const promises = this.blockChain.networkNodes.map(networkNodeUrl => rp({
            "uri": networkNodeUrl+"/register-node",
            "method": "post",
            "body": { "newNodeUrl": newNodeUrl },
            "json": true
        }));

        Promise.all(promises)
        .then(data => rp({
            "uri": newNodeUrl+"/register-nodes-bulk",
            "method": "post",
            "body": { "allNetworkNodes" : [... this.blockChain.networkNodes, this.url ]},
            "json": true 
        }))
        .then(data => {
            res.json({ message: "Node registered with network succesfully"});
        })  
        .catch(error => {
            console.log(error);
        });
    }

    private registerNode(req, res) : void {
        const newNodeUrl : string = req.body.newNodeUrl;
        if(this.blockChain.networkNodes.indexOf(newNodeUrl) === -1 && newNodeUrl != this.url){
            this.blockChain.networkNodes.push(newNodeUrl);
        }
        res.json({ message: "Node "+newNodeUrl+ " registered" });
    }

    private registerNodesBulk(req, res) : void {
        const allNetworkNodes : string[] = req.body.allNetworkNodes;
        let new_registered_nodes : number = 0;
        allNetworkNodes.forEach(networkNodeUrl => {
            if(this.blockChain.networkNodes.indexOf(networkNodeUrl) === -1 && networkNodeUrl != this.url){
                this.blockChain.networkNodes.push(networkNodeUrl);
                new_registered_nodes++;
            }
        });
        res.json({ message: "Node bulk registration succesfull, "+ new_registered_nodes+ " new nodes added to local network"});
    }

    private createTransactionAndBroadCast(req, res) : void {
        const amount : number = req.body.amount;
        const sender : string = req.body.sender;
        const recipient : string = req.body.recipient;
        const message : string = req.body.message || "";
        const transaction : Transaction = this.blockChain.createNewTransaction(amount, sender, recipient, message);
        const blockIndex : number = this.blockChain.addTransactionToPendingTransactions(transaction);
        
        const promises = this.blockChain.networkNodes.map(nodeUrl => {
            return rp({
                "uri": nodeUrl+"/transaction",
                "method": "post",
                "body": { "transaction" : transaction },
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

    public createTransaction(req, res){
        const transaction = req.body.transaction;
        const blockIndex = this.blockChain.addTransactionToPendingTransactions(transaction);
        console.log(this.url, transaction.id, blockIndex);
        res.json({ message: `Transaction will be added in block ${blockIndex}` });
    }

    private mine(req, res) : void {
        
        const previousBlock : Block = this.blockChain.getLastBlock();
        const previousBlockHash : string = previousBlock['hash'];
        const currentBlockData : BlockData  = {
            index:  previousBlock['index'] + 1,
            transactions: this.blockChain.pendingTransactions,
        }
        const nonce : number = this.blockChain.proofOfWork(previousBlockHash, currentBlockData);
        const hash : string = this.blockChain.hashBlock(previousBlockHash, currentBlockData, nonce);

        const newBlock : Block = this.blockChain.createNewBlock(nonce, previousBlockHash, hash);

        const promises = this.blockChain.networkNodes.map(nodeUrl => {
            return rp({
                 "uri": nodeUrl+"/receive-new-block",
                 "method": "post",
                 "body": { "block": newBlock },
                 "json": true
             });
        });
        
        Promise.all(promises)
        .then(data => {
            const rewardTransaction : Transaction = this.blockChain.getRewardTransaction(this.id);
            return  rp({
                "uri":  this.url+"/transaction/broadcast",
                "method": "post",
                "body": rewardTransaction,
                "json": true
            })
        })
        .then(data => {
            res.json({ message: "New block mined succesfully", block: newBlock });
        })
        .catch(error => {
            console.log(error);
        });
    }

    private receiveNewBlock(req, res) : void {
        const block : Block = req.body.block; 
        const newBlockIsValid : boolean = this.blockChain.checkNewBlockValidity(block);
        if(newBlockIsValid){
            this.blockChain.chain.push(block);
            this.blockChain.pendingTransactions = []; 
            res.json({
                "message": "New block accepted",
                "block": block
            });
        }
        else{
            res.json({
                "message": "New block rejected",
                "block": block
            });
        }
    }

    private getConsensus(req, res) : void {
        
        const promises = this.blockChain.networkNodes.map(nodeUrl => {
            return rp({
                "uri": nodeUrl+"/blockchain",
                "method": "get",
                "json": true
            });
        });

        Promise.all(promises)
        .then(blockchains => {
            
            const currentChainLength : number = this.blockChain.chain.length;
            let maxChainLength : number = currentChainLength;
            let newLongestChain : Block[] = null;
            let newPendingTransactions : Transaction[] = null;

            blockchains.forEach(bc => {
                if(bc.chain.length > maxChainLength){
                    maxChainLength = bc.chain.length;
                    newLongestChain = bc.chain;
                    newPendingTransactions = bc.pendingTransactions;
                }
            });

            if(!newLongestChain || ( newLongestChain && !this.blockChain.chainIsValid(newLongestChain))){
                res.json({
                    "message": "Current chain has not been replaced.",
                    "chain": this.blockChain.chain
                });
            }
            else{
                this.blockChain.chain =  newLongestChain;
                this.blockChain.pendingTransactions = newPendingTransactions;
                res.json({
                    "message": "Current chain has been replaced.",
                    "chain": this.blockChain.chain
                });
            }
        });
    }

    getTransactionByTransactionId(req, res) : void {
        const transaction_id : string = req.params.transaction_id;
    }

    getBlockByBlockHash(req, res) : void {
        const block_hash : string = req.params.block_hash;
    }

    getAddressByAddressId(req, res) : void {
        const address_id : string = req.params.address_id;
    }
}