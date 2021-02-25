"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const uuid_1 = require("uuid");
class Transaction {
    constructor(amount, sender, recipient, message) {
        this.id = uuid_1.v4();
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.message = message;
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=transaction.js.map