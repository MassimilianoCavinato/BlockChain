export class  Transaction {
    
    private amount : number;
    private sender : string;
    private recipient: string;

    constructor(amount: number, sender: string, recipient: string){
       this.amount = amount;
       this.sender = sender;
       this.recipient = recipient;
    }   
}