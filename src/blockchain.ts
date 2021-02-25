import { sha256 } from 'sha256';
import { Block }  from './block';
import { Transaction } from './transaction';

export class BlockChain {

    public difficulty : number;
    public chain : Block[];
    public pendingTransactions : Transaction[];
    public networkNodes: string[];
    public localNodeUrl: string;
    
    constructor(){
        this.difficulty = 2;
        this.chain = [];
        this.networkNodes = [];
        this.pendingTransactions = [];
        //GENESIS BLOCK       
        this.createNewBlock(0, "0", "0");
    }

    createNewBlock(nonce, previousBlockHash, hash) : Block {
        const newBlock = new Block(
            this.chain.length + 1,
            this.pendingTransactions,
            nonce,
            hash,
            previousBlockHash
        );
        this.pendingTransactions = [];
        this.chain.push(newBlock);
        return newBlock;
    }

    getLastBlock() : Block {
        return this.chain[this.chain.length - 1];
    }

    createNewTransaction(amount: number, sender: string, recipient: string) : number {
        const newTransaction = new Transaction(amount, sender, recipient);
        this.pendingTransactions.push(newTransaction);
        return this.getLastBlock()['index'] + 1;
    }

    hashBlock(previousBlockHash: string, currentBlockData: any, nonce: number) : string {
        const dataString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash =  sha256(dataString);
        return hash;
    }

    proofOfWork(previousBlockHash: string, currentBlockData: any) : number{
        //repeatedly hash using "random seed" until first n characted in sha56 are all 0
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        while(hash.substring(0, this.difficulty) !== "0".repeat(this.difficulty)){
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        }
        return nonce;
    }
}

