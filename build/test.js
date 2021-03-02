"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rp = require("request-promise");
const networkNode_1 = require("./networkNode");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function runTest() {
    //INSTANCE NODES
    const node_relay = new networkNode_1.NetworkNode(3040);
    await delay(2000);
    const node_3041 = new networkNode_1.NetworkNode(3041);
    await delay(2000);
    const node_3042 = new networkNode_1.NetworkNode(3042);
    await delay(2000);
    const node_3043 = new networkNode_1.NetworkNode(3043);
    await delay(2000);
    const node_3044 = new networkNode_1.NetworkNode(3044);
    await delay(2000);
    const node_3045 = new networkNode_1.NetworkNode(3045);
    await delay(3000); //Hack: Making sure all tunnels are up in async constructor
    rp({
        "uri": node_relay.url + "/register-and-broadcast-node",
        "method": "post",
        "body": { "newNodeUrl": node_3041.url },
        "json": true
    });
    rp({
        "uri": node_relay.url + "/register-and-broadcast-node",
        "method": "post",
        "body": { "newNodeUrl": node_3042.url },
        "json": true
    });
    rp({
        "uri": node_relay.url + "/register-and-broadcast-node",
        "method": "post",
        "body": { "newNodeUrl": node_3043.url },
        "json": true
    });
    rp({
        "uri": node_relay.url + "/register-and-broadcast-node",
        "method": "post",
        "body": { "newNodeUrl": node_3044.url },
        "json": true
    });
    rp({
        "uri": node_relay.url + "/register-and-broadcast-node",
        "method": "post",
        "body": { "newNodeUrl": node_3045.url },
        "json": true
    });
    await delay(3000);
    // rp({
    //     "uri":  node_3043.url+"/mine",
    //     "method": "get",
    // });
    rp({
        "uri": node_3045.url + "/transaction/broadcast",
        "method": "post",
        "body": {
            "amount": 200,
            "sender": "Massimiliano",
            "recipient": "Bob",
            "message": "Hello World"
        },
        "json": true
    });
    rp({
        "uri": node_3043.url + "/transaction/broadcast",
        "method": "post",
        "body": {
            "amount": 500,
            "sender": "Charles",
            "recipient": "Edwin",
            "message": "Rent deposit"
        },
        "json": true
    });
    await delay(3000);
    console.log("mining");
    //simulate mining
    rp({
        "uri": node_3042.url + "/mine",
        "method": "get",
    });
    await delay(5000);
    rp({
        "uri": node_3042.url + "/consensus",
        "method": "get",
    });
    // console.log(node_relay);
    // console.log(node_3041);
    // console.log(node_3042);
    // console.log(node_3043);
    // console.log(node_3044);
    // console.log(node_3045);
}
runTest();
//# sourceMappingURL=test.js.map