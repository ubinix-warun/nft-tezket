const { TezosToolkit, MichelsonMap } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const { char2Bytes, bytes2Char } = require("@taquito/utils");

const fs = require("fs");

// https://ithacanet.ecadinfra.com // ----------------------------------
const faucet1 = require('../faucet1.json');
// const faucet2 = require('../faucet2.json');
// const faucets = [
//     // faucet1, // ACTIVATED // tz1UdAFNh3GafdxoXg4D2BefeYU2g6fGJUYF
//     // faucet2  // ACTIVATED // tz1gcUBbFpRzVgPSU2hrHg3dPTNp5NC5ncQH
// ];
// ---------------------------------------------------------------------

const rpc = 'https://ithacanet.ecadinfra.com';
const signer = InMemorySigner.fromFundraiser(faucet1.email, faucet1.password, faucet1.mnemonic.join(' '));

const Tezos = new TezosToolkit(rpc);
Tezos.setSignerProvider(signer);

const mintTezket = async () => {

    const ownerAddress = await Tezos.signer.publicKeyHash();
    const nftContract = 'KT1Q88GESbqLK6mTJu7NL42DiFkGAmiBfhMb';

    // Mint XXX
    const contract = await Tezos.contract.at(nftContract);
    const op = await contract.methods
            .mint(char2Bytes("ipfs://" + "TEST"), ownerAddress)
            .send();
    await op.confirmation();

    // console.log("Op hash:", op.opHash);

    nftStorage = await contract.storage();
    const getTokenIds = await nftStorage.reverse_ledger.get(ownerAddress);

    getTokenIds.map(async id => {
        const tokenId = id.toNumber();
        const metadata = await nftStorage.token_metadata.get(tokenId);
        const tokenInfoBytes = metadata.token_info.get("");
        const tokenInfo = bytes2Char(tokenInfoBytes);

        console.log({
            tokenId,
            ipfsHash:
              tokenInfo.slice(0, 7) === "ipfs://" ? tokenInfo.slice(7) : null
          });
    });


};

(async () => {
    await mintTezket();

})().catch(e => console.error(e));

