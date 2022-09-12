# NFT-Tezket v1

Tezket -- "Tezos Ticket", Backend operator -- Mint NFT ticket (Tezos Smartcontract)., [MIT LICENSE](https://github.com/ubinix-warun/rn-tezket/blob/master/LICENSE)

# System Architecture

<img src="https://user-images.githubusercontent.com/3756229/175788708-b82f53d9-f455-4986-9e5c-b967d8d4876c.png" width="70%">

### Version 2 -- Revision by [TezKet](https://github.com/tezket/)
* [Pitch Gist!](https://gist.github.com/ubinix-warun/fe48b4e72457b59cb01a732b6abde4c0) -- Intro & Roadmap.

### Version 1
1. [rn-tezket](https://github.com/ubinix-warun/rn-tezket) -- ReactNative app, Buy NFT ticket and use QR to control admittance at the gate.
2. [nft-tezket](https://github.com/ubinix-warun/nft-tezket) -- Backend operator, Mint NFT ticket (Tezos Smartcontract).


## Demo

### 1. [Demo -- Connect the Wallet and Mint NFT Ticket](https://youtu.be/Wn3L77-08oA) 
### 2. [Demo -- Use QR to control admittance at the gate](https://youtu.be/JHkj7S3R5XE) (New)

# Setup Smartcontract & Config Backend

### 1. Deploy "NTFS_contract" (FA2) on Ithacanet.

```
nvm use v16.14.0
npm install
node ./script/build.js     # pls, install ligo compiler.
node ./script/deploy.js

node ./script/activateAccounts.js # (optional) use faucet1.json for deployer.

```

### 2. Config Pinata's ApiKey on backends/PinataKeys.ts
```
export default {
  apiKey: "XXXXXXXXXXXXXXXX",
  apiSecret: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
};
```

### 3. Run Backend operators
```
npm run start
npm run dev      # dev mode!
```

# Add New Ticket and Customize Template.

* New file on ticket folder.

```
- ticket/*
   \ New Ticket Type (json) 
- image
- mint/qr
```

* Edit ticket/new-ticket-type.json.

```
{
    "name": "The Garden City",
    "baseimg": "image/1234_SQ1",
    "tag": "1 DAY PASS",
    "keyword": "The Silicon Valley of India.",
    "description": "Bengaluru (also called Bangalore) is the center of India's high-tech\nindustry. The city is also known for its parks and nightlife.",
    "timepref": "Vaild in 22/07/2022",
    "render": "SQ1QR"
}
```

* Patch API '/mint' with new-render-type or use defaults "SQ1QR".
```
    else if(mintTicket.render == "new-ticket-type") {

```

* (optional) Customize ticket-template with SVG.

```
      const svgImage = `
        <svg width="${width}" height="${height}">
          <style>
          .ticketName { fill: #001; font-size: 25px; font-weight: bold;}
          .ticketMeta { fill: #001; font-size: 15px; font-weight: bold;}
          </style>
          <rect width="100%" height="100%" fill="white" />
                ...
                
          <text x="22" y="608" text-anchor="left" class="ticketMeta">MINT DATE: ${timestamp}</text>
       </svg>
       `;
```

* Edit new ticket type on src/screens/Tickets.tsx. [rn-tezket](https://github.com/ubinix-warun/rn-tezket)

```
export const TicketList: TicketInfo[] = [
  ...
];
```

# Credit

* Use [ExpressJS/TS](https://expressjs.com/) for API TypeScript Server.
* Storage NFT Ticket via [Pinata](https://www.pinata.cloud/).
* Many thanks -- [Taquito](https://github.com/ecadlabs/taquito) for [Tezos blockchain](https://tezos.com/).

