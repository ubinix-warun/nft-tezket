const { TezosToolkit } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');

// https://ithacanet.ecadinfra.com // ----------------------------------
const faucet1 = require('../faucet1.json');
// const faucet2 = require('../faucet2.json');
// const faucets = [
//     // faucet1, // ACTIVATED // tz1UdAFNh3GafdxoXg4D2BefeYU2g6fGJUYF
//     // faucet2  // ACTIVATED // tz1gcUBbFpRzVgPSU2hrHg3dPTNp5NC5ncQH
// ];
// ---------------------------------------------------------------------

const rpc = 'https://ithacanet.ecadinfra.com';
const Tezos = new TezosToolkit(rpc);

Tezos.setSignerProvider(InMemorySigner.fromFundraiser(faucet1.email, faucet1.password, faucet1.mnemonic.join(' ')))

const transfer = async() => {
    const toAddress = 'tz1gcUBbFpRzVgPSU2hrHg3dPTNp5NC5ncQH';

    const amount = 10;

    console.log(`Transfering ${amount} ꜩ to ${toAddress}...`);
    const operation = await Tezos.contract.transfer({ to: toAddress, amount });
    console.log(`Waiting for ${operation.hash} to be confirmed...`);
    await operation.confirmation()

    console.log(`Operation injected: https://ithaca.tzstats.com/${operation.hash}`);
};

(async () => {
    await transfer();
    process.exit(0);
})().catch(e => {
    console.error(e);
    process.exit(1);
});