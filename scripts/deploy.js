const { TezosToolkit, MichelsonMap } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');

const fs = require("fs");

// https://ithacanet.ecadinfra.com // ----------------------------------
const faucet1 = require('../faucet1.json');
// const faucet2 = require('../faucet2.json');
// const faucets = [
//     // faucet1, // ACTIVATED // tz1UdAFNh3GafdxoXg4D2BefeYU2g6fGJUYF
//     // faucet2  // ACTIVATED // tz1gcUBbFpRzVgPSU2hrHg3dPTNp5NC5ncQH
// ];
// ---------------------------------------------------------------------

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


const rpc = 'https://ithacanet.ecadinfra.com';
const signer = InMemorySigner.fromFundraiser(faucet1.email, faucet1.password, faucet1.mnemonic.join(' '));

const Tezos = new TezosToolkit(rpc);
Tezos.setSignerProvider(signer);

const deployer = async (options) => {
    const { file, storage, owner } = options;

    const codeMligo = JSON.parse(fs.readFileSync(`./build/${file}_factory.json`).toString());
    // console.log(codeMligo);

    const op = await Tezos.contract.originate({
        code: codeMligo,
        storage,
    });
    await op.confirmation();
    const contract = await op.contract();

    const detail = {
        address: contract.address,
        owner,
        network: rpc,
    };

    fs.writeFileSync(`./deployed/${file}_latest.json`, JSON.stringify(detail));
    console.log(`Contract ${file} deployed at:`, contract.address);

    return contract;
}

const deployNFTSContract = async () => {

    // Deploy NFTS contract
    const owner = await Tezos.signer.publicKeyHash();
    const storage = {
        ledger: new MichelsonMap(),
        operators: new MichelsonMap(),
        reverse_ledger: new MichelsonMap(),
        metadata: new MichelsonMap(),
        token_metadata: new MichelsonMap(),
        next_token_id: 0n,
        admin: owner,
    };

    // [x] AddressValidationError: [admin] Address is not valid: undefined
    // 
    // https://ide.ligolang.org/p/nS81LcIv_bx8xvb74hQ4Zw
    // 
    // Example: storage
    // {
    //     ledger = (Big_map.empty: (token_id, address) big_map);
    //     operators = (Big_map.empty: ((address * (address * token_id)), unit) big_map);
    //     reverse_ledger = (Big_map.empty: (address, token_id list) big_map);
    //     metadata = Big_map.literal [
    //     ("", Bytes.pack("tezos-storage:contents"));
    //     ("contents", ("7b2276657273696f6e223a2276312e302e30222c226e616d65223a2254555473222c22617574686f7273223a5b2240636c617564656261726465225d2c22696e7465726661636573223a5b22545a49502d303132222c22545a49502d303136225d7d": bytes))
    //     ];
    //     token_metadata = (Big_map.empty: (token_id, token_metadata) big_map);
    //     next_token_id = 0n;
    //     admin = ("tz1Me1MGhK7taay748h4gPnX2cXvbgL6xsYL": address);
    // }
    //
    // Contract NFTS_contract deployed at: KT1Q88GESbqLK6mTJu7NL42DiFkGAmiBfhMb
    // https://ithaca.tzstats.com/KT1Q88GESbqLK6mTJu7NL42DiFkGAmiBfhMb

    await deployer({storage, file: 'NFTS_contract', owner});
};

(async () => {
    await deployNFTSContract();

})().catch(e => console.error(e));

