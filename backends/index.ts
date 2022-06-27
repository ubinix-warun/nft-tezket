import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app: Express = express();
const cors = require("cors");
const moment = require("moment");
const sharp = require("sharp");
const { 
  execSync
} = require('child_process');
import axios, { AxiosResponse } from 'axios';

import pinataSDK from "@pinata/sdk";

const { TezosToolkit, MichelsonMap } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const { char2Bytes, bytes2Char } = require("@taquito/utils");

const fs = require("fs");
const randomstring = require("randomstring");

const faucet1 = require('../faucet1.json');
// const faucet2 = require('../faucet2.json');
// const faucets = [
//     // faucet1, // ACTIVATED // tz1UdAFNh3GafdxoXg4D2BefeYU2g6fGJUYF
//     // faucet2  // ACTIVATED // tz1gcUBbFpRzVgPSU2hrHg3dPTNp5NC5ncQH
// ];


let pinata: any;
if (process.env.NODE_ENV === "production") {
  pinata = pinataSDK(process.env.PINATA_API_KEY || '', process.env.PINATA_SECRET_KEY || '');
} else {
  const PinataKeys = require("./PinataKeys").default;
  pinata = pinataSDK(PinataKeys.apiKey, PinataKeys.apiSecret);
}

const rpc = 'https://ithacanet.ecadinfra.com';
const nftContract = 'KT1Q88GESbqLK6mTJu7NL42DiFkGAmiBfhMb';

const status = 'https://api.ithaca.tzstats.com/explorer/status';

const signer = InMemorySigner.fromFundraiser(faucet1.email, faucet1.password, faucet1.mnemonic.join(' '));

const Tezos = new TezosToolkit(rpc);
Tezos.setSignerProvider(signer);

const port = process.env.NODE_ENV === "production" ? process.env.PORT : 8082; // default port to listen
const portWs = process.env.NODE_ENV === "production" ? process.env.PORTWS : 8083; // default port to listen

const corsOptions = {
  origin: ["http://localhost:8082", "http://localhost:19006", "http://192.168.1.114:19006",
  "https://dc8259a198fc.ap.ngrok.io"],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));

app.get('/', async function (req: Request, res: Response) {

    let result: AxiosResponse = await axios.get(status);
    const blockheight = result.data.blocks;

    res.send(`Hello developers! <br/><br/>RPC: ${rpc}<br/>Block Height: ${blockheight}`);
});

function respError(req: any, res: any, msg: any, err: any) {
  if(err) {
    console.log(msg+"\r\n"+err);
  }
  res
    .status(500)
    .json({ 
      minterAddress: req.body.minterAddress,
      status: false, 
      msg: msg
    });
}

let sockets = new Map<string, WebSocket>();
const wss = new WebSocketServer({ port: 8083 });

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
    // walletAddress, ws

    const obj = JSON.parse(data.toString());

    if(obj.userAddress != undefined) {
      sockets.set(obj.userAddress, ws);
    } else {

      ws.close();
    }
  });

  ws.on('close', function close() {
    console.log('disconnected');
  });

  ws.send('something');
});

app.get('/sign/:address/:gateaddress', async function (req: Request, res: Response) {

  const addr = req.params.address;
  const gateaddr = req.params.gateaddress;

  if(!sockets.has(addr)) {
    respError(req,res,'ERR: Invalid sign.addr='+addr, null);
    return ;
  }

  // if(!sockets.has(gateaddr)) {
  //   respError(req,res,'ERR: Invalid sign.gateaddr='+gateaddr, null);
  //   return ;
  // }

  sockets.get(addr)?.send(`SIGN:${req.params.gateaddress}`);
    
  res.status(200).json({ 
    userAddress: req.params.address,
    gateAddress: req.params.gateaddress
  });

});

app.get('/use/:address/:ticketid/:signature/:gateaddress', async function (req: Request, res: Response) {

  const addr = req.params.address;
  const gateaddr = req.params.gateaddress;

  if(!sockets.has(addr)) {
    respError(req,res,'ERR: Invalid sign.addr='+addr, null);
    return ;
  }

  // if(!sockets.has(gateaddr)) {
  //   respError(req,res,'ERR: Invalid sign.gateaddr='+gateaddr, null);
  //   return ;
  // }

  // SAVE
  
  sockets.get(gateaddr)?.send(`DONE:${req.params.address}`);

  res.status(200).json({ 
    userAddress: req.params.address,
    ticketId: req.params.ticketid,
    signature: req.params.signature,
    gateAddress: req.params.gateaddress,
  });

});

// app.get('/testwallet', async function (req: Request, res: Response) {

//   sockets.forEach((ws: WebSocket) => {
//     ws.send("testwallet");
//   });
//   res.send(`/testwallet`);
// });

app.post('/mint', async function(req, res) {

  // validate payRef from SQ.
  // verify owner (mintAddress) by payRef and signRef.

  var nftPath = '';

  var nftState = 'REQUEST';
  var nftTicketId = '';
  var pinnedFile, pinnedMetadata;

  // ticketType
  //  - [x] read metadata, type, period
  //  - [x] read img form meta and 
  //      gen [-] ticket Id + [x] qrcode.

  try {

    const jsonString = fs.readFileSync(__dirname+"/ticket/"+req.body.ticketType+".json");
    const mintTicket = JSON.parse(jsonString);

    if(mintTicket.render == "SQ1QR") {

      let ts = Date.now();
      // const datetime = moment(ts).format('MMMM Do YYYY, h:mm:ss a');
      const timestamp = moment(ts).format('DD/MM/YYYY hh:mm A');

      // let tId = 1; // ?
      let result: AxiosResponse = await axios.get(status);
      const bhigh = result.data.blocks;
      
      const width = 375;
      const height = 628;
      const name = mintTicket.name;
      const keyword = mintTicket.keyword;
      const ticketType = mintTicket.tag;
      // const ticketId = String(tId).padStart(20, '0');
      const ticketId = req.body.minterAddress + "-" + randomstring.generate(7);
      const period = "-";
      
      const imgbase = __dirname + "/" + mintTicket.baseimg;

      nftPath = `${__dirname}/mint/${ticketId}.jpg`;
      nftTicketId = `${ticketId}`

      const svgImage = `
        <svg width="${width}" height="${height}">
          <style>
          .ticketName { fill: #001; font-size: 25px; font-weight: bold;}
          .ticketMeta { fill: #001; font-size: 15px; font-weight: bold;}
          </style>
          <rect width="100%" height="100%" fill="white" />
          <text x="22" y="40" text-anchor="left" class="ticketName">${name}</text>
          <text x="22" y="62" text-anchor="left" class="ticketMeta">${keyword}</text>
          <text x="22" y="100" text-anchor="left" class="ticketMeta">TYPE: ${ticketType}</text>
          <text x="22" y="115" text-anchor="left" class="ticketMeta">TICKET: </text>
          <text x="22" y="130" text-anchor="left" class="ticketMeta">PERIOD: ${period}</text>
          
          <text x="22" y="608" text-anchor="left" class="ticketMeta">MINT DATE: ${timestamp}</text>
        </svg>
        `;

      // [x] base
      // [x] bg white
      //
      // [-] ticktId (gen?)
      // [x] ticket.name,
      // [x] timestamp
      // 
      // [x] blockHeight
      //
      // [x] image ticket (260 x H)
      // 
      // [x] gen qr base
      //

      execSync(`convert ${imgbase}.jpg -resize 80% -gravity center -extent 333x440 ${imgbase}.png`, (err:any, stdout:any, stderr:any) => {
        if (err) {
         console.error("execSync (convert banner):" + err);
         return;
        }
        console.log(stdout);
      });

      execSync(`qrencode -o ${__dirname}/mint/qr/${ticketId}.png \
      '${req.body.ticketType};${ticketId};${period};startdate;enddate;${bhigh};${req.body.minterAddress};${req.body.payRef};${req.body.signRef};'`, (err:any, stdout:any, stderr:any) => {
        if (err) {
         console.error("execSync (gen qr code):" + err);
         return;
        }
        console.log(stdout);
      });

      execSync(`convert ${__dirname}/mint/qr/${ticketId}.png -resize 70% ${__dirname}/mint/qr/${ticketId}.png`, (err:any, stdout:any, stderr:any) => {
        if (err) {
         console.error("execSync (resize qr):" + err);
         return;
        }
        console.log(stdout);
      });

      const svgBuffer = Buffer.from(svgImage);
      const image =  await sharp(svgBuffer)
        .composite([
          {
            input: imgbase + ".png",
            top: 144,
            left: 22
          },
          {
            input: `${__dirname}/mint/qr/${ticketId}.png`,
            top: 18,
            left: 262,
          },
        ])
        .toFormat("jpeg", { mozjpeg: true })
        .toFile(nftPath);

      nftState = 'GENERATED';

      // convert 1234_SQ1.jpg -resize 80% -gravity center -extent 333x440 1234_SQ1.png 
      // qrencode -o qrcode.png 'ticketType;ticketId;period;tz1guKCxDX2dwxVhBWeXREdp3Zv6mh68QVKp;xyz;bhigh;payRefXXXXXXX;signRefXXXXX;'
      // convert qrcode.png -resize 70% qrcode.png 

    } else {
      respError(req,res,'ERR: Invalid ticket.render='+mintTicket.ticketType, null);
      return;
    }

  } catch (err) {
    respError(req,res,'ERR: Invalid ticketType='+req.body.ticketType, err);
    return;
  }


  // upload pinata
  // - gen IpfsHash Img & Metadata. 

  try {

    if(nftPath != '')
    {
      const jsonString = fs.readFileSync(__dirname+"/ticket/"+req.body.ticketType+".json");
      const mintTicket = JSON.parse(jsonString);

      await pinata
        .testAuthentication()
        .catch((err: any) => {
          respError(req,res,'ERR: IPFS testAuthentication()', err);
        });

      const readableStreamForFile = fs.createReadStream(nftPath);

      const options: any = {
        pinataMetadata: {
          name: mintTicket.name.replace(/\s/g, "-"),
          keyvalues: {
            tag: mintTicket.tag,
            id: nftTicketId
          }
        }
      };
      pinnedFile = await pinata.pinFileToIPFS(
        readableStreamForFile,
        options
      );

      if (pinnedFile.IpfsHash && pinnedFile.PinSize > 0) {

        // fs.unlinkSync(nftpath);

        const metadata = {
          name: mintTicket.name,
          description: mintTicket.description,
          symbol: "TZT"+"-"+req.body.ticketType,
          artifactUri: `ipfs://${pinnedFile.IpfsHash}`,
          displayUri: `ipfs://${pinnedFile.IpfsHash}`,
          creators: ["tezket"],
          decimals: 0,
          thumbnailUri: "https://tezostaquito.io/img/favicon.png",
          is_transferable: true,
          shouldPreferSymbol: false
        };
  
        pinnedMetadata = await pinata.pinJSONToIPFS(metadata, {
          pinataMetadata: {
            name: "TZT-metadata"
          }
        });

        if (pinnedMetadata.IpfsHash && pinnedMetadata.PinSize > 0) {

          nftState = 'PINNED';

        } else {

          // LOG FOR RECOVERY ...
          respError(req,res,"ERR: metadata were not pinned (Pinata)", null);
          return;
        }

      } else {

        // LOG FOR RECOVERY ...
        respError(req,res,"ERR: file was not pinned (Pinata)", null);
        return;
      }

    }

  } catch (err) {
    respError(req,res,'ERR: run Pinata script='+nftTicketId, err);
    return;
  }

  // update nft & reserve contract
  // - call mint contract (IpfsHash META, minterAddress)
  // - call reserve fn. (minterAddress, ticketId, IpfsHash FILE, IpfsHash META, OpHash)

  if(nftState == "PINNED") 
  {
      // Mint XXX
      const contract = await Tezos.contract.at(nftContract);
      const op = await contract.methods
              .mint(char2Bytes("ipfs://" + pinnedMetadata.IpfsHash), 
                  req.body.minterAddress)
              .send();
      await op.confirmation();
    
      console.log(op);

      // ERROR ?


      // LOG FOR RECOVERY ...
  }

  res.status(200).json({ 
    minterAddress: req.body.minterAddress,
    status: true,
    ipfs: {
      imageHash: pinnedFile.IpfsHash,
      metadataHash: pinnedMetadata.IpfsHash
    }
  });

});

// app.post('/stamp', function(req, res) {
// ..
// });

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port} \r\n\t\t\t & ws://localhost:${portWs}`);
});