import { v4 as uuidv4 } from 'uuid';

export class  Transaction {
    
    private id: string;
    private amount : number;
    private sender : string;
    private recipient: string;
    private message: string;

    constructor(amount: number, sender: string, recipient: string, message: string){
        this.id = uuidv4();
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.message = message;
    }   
}