import { Transaction } from './transaction';

export class Block {

    public index : number;
    public timestamp : number;
    public transactions : Transaction[];
    public nonce : number;
    public hash : string;
    public previousBlockHash : string;

    constructor(index:number, transactions:Transaction[], nonce:number, hash:string, previousBlockHash:string) {
        this.index = index;
        this.timestamp = Date.now();
        this.transactions = transactions;
        this.nonce = nonce;
        this.hash = hash;
        this.previousBlockHash = previousBlockHash;
    }   
}