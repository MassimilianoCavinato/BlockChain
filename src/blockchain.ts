import * as  sha256  from 'sha256';
import { v4 as uuidv4 } from 'uuid';
import { Block, BlockData, Transaction  } from './interfaces';

export class BlockChain {

    public difficulty : number;
    public chain : Block[];
    public pendingTransactions : Transaction[];
    public networkNodes: string[];
    public localNodeUrl: string;
    private reward: number = 1;
    
    constructor(){
        this.difficulty = 2;
        this.chain = [];
        this.networkNodes = [];
        this.pendingTransactions = [];
        //GENESIS BLOCK       
        this.createNewBlock(0, "0", "0");
    }

    public createNewBlock(nonce, previousBlockHash, hash) : Block {
        const block : Block = {
            index : this.chain.length + 1,
            timestamp : Date.now(),
            transactions : [],
            nonce: nonce,
            hash: hash,
            previousBlockHash: previousBlockHash
        }
        this.pendingTransactions = [];
        this.chain.push(block);
        return block;
    }

    public getLastBlock() : Block {
        return this.chain[this.chain.length - 1];
    }

    public createNewTransaction(amount: number, sender: string, recipient: string, message: string) : Transaction {
        const transaction : Transaction = {
            id: uuidv4().replace(/-/g, ''),
            amount: amount,
            sender: sender,
            recipient: recipient,
            message: message,
        }
        return transaction;
    }

    public addTransactionToPendingTransactions(transaction: Transaction) : number {
        this.pendingTransactions.push(transaction);
        return this.getLastBlock()['index'];
    }

    public hashBlock(previousBlockHash: string, currentBlockData: BlockData, nonce: number) : string {
        const dataString : string = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash : string =  sha256(dataString);
        return hash;
    }

    public proofOfWork(previousBlockHash: string, currentBlockData: any) : number{
        //repeatedly hash using "random seed" until first n characters in sha56 are all 0
        let nonce : number = 0;
        let hash : string = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        while(hash.substring(0, this.difficulty) !== "0".repeat(this.difficulty)){
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        }
        return nonce;
    }
    
    public getRewardTransaction(nodeId: string) : Transaction {
        const rewardTransaction : Transaction = {
            id:  uuidv4().replace(/-/g, ''),
            amount: this.reward,
            sender: "0",
            recipient: nodeId,
            message: "Mining reward.",
        }
        return rewardTransaction;
    }

    public checkNewBlockValidity(newBlock: Block) : boolean {
        const lastBlock : Block = this.getLastBlock();
        const correctHash : boolean =  lastBlock["hash"] === newBlock["previousBlockHash"];
        const correctIndex : boolean =  lastBlock["index"] + 1 === newBlock["index"];
        return correctHash && correctIndex;
    }

    public chainIsValid(chain: Block[]) : boolean {
        for(var i=1; i<chain.length; i++){
            const currentBlock : Block = chain[i];
            const prevBlock : Block = chain[i-1];
            const currentBlockData : BlockData = { 
                "transactions": currentBlock["transactions"],
                 "index": currentBlock["index"] 
            }
            const blockHash : string = this.hashBlock(prevBlock["hash"], currentBlockData,currentBlock["nonce"]);
            if(blockHash.substring(0, this.difficulty) !== "0".repeat(this.difficulty)) return false;
            if(chain[i]["previousBlockHash"] !== chain[i-1]["hash"]) return false;
        }
        //check genesis block
        const genesisBlock : Block = chain[0];
        if(genesisBlock["nonce"] !== 0) return false;
        if(genesisBlock["previousHash"] !== "0") return false;
        if(genesisBlock["hash"] !== "0") return false;
        if(genesisBlock["transactions"].length !== 0) return false;

        return true;
    }
}