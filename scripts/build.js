const { exec } = require("child_process");
const fs = require("fs");

const args = process.argv.slice(2);

let contracts = [
    { 
        "fname": "NFTS_contract",
        "ename": "fa2_main"
    }
];

if( args.length ) {
    contracts = args
}

for (const contract of contracts) {
    exec(`ligo compile contract --michelson-format json ./contracts/${contract.fname}.mligo -e ${contract.ename} -o ./build/${contract.fname}_factory.json`, (err, stdout, stderr) => {
        if (err) {
            throw err;
        }
        console.log(`File ${contract.fname} compiled!`);
    });
}