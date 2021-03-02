export interface  Transaction {
    id: string;
    amount : number;
    sender : string;
    recipient: string;
    message: string;
}

export interface Block {
    index : number;
    timestamp : number;
    transactions : Transaction[];
    nonce : number;
    hash : string;
    previousBlockHash : string;
}

export interface BlockData {
    index : number;
    transactions : Transaction[];
}

