const { TezosToolkit } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');

// https://ithacanet.ecadinfra.com // ----------------------------------
const faucet1 = require('../faucet1.json');
// const faucet2 = require('../faucet2.json');
const faucets = [
//     // faucet1, // ACTIVATED // tz1UdAFNh3GafdxoXg4D2BefeYU2g6fGJUYF
//     // faucet2  // ACTIVATED // tz1gcUBbFpRzVgPSU2hrHg3dPTNp5NC5ncQH
];
// ---------------------------------------------------------------------

const rpc = 'https://ithacanet.ecadinfra.com';
const Tezos = new TezosToolkit(rpc);

Tezos.setSignerProvider(InMemorySigner.fromFundraiser(faucet1.email, faucet1.password, faucet1.mnemonic.join(' ')))

const activateFaucets = async () => {
    for (const faucet of faucets) {
        const {pkh, activation_code} = faucet;
        const operation = await Tezos.tz.activate(pkh, activation_code);
        await operation.confirmation();
    }
}

(async () => {
    await activateFaucets();
})().catch(e => console.error(e));