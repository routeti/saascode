import {
  WAMessage,
} from "@adiwajshing/baileys";
import axios from "axios";
import { isNil} from "lodash";
import mime from "mime-types";
import fs from "fs"

import Queue from "../../models/Queue";
import Setting from "../../models/Setting";
import Ticket from "../../models/Ticket";

import { getBodyMessage } from "./wbotMessageListener";
import { TypebotService } from "../TypebotService/apiTypebotService";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import SendWhatsAppMedia from "./SendWhatsAppMedia";
import path from "path";
import { Readable } from "stream";

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

async function baixarESalvarArquivo(url) {
  try {
    const resposta = await axios({
      url: url,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    // Inferir a extensão com base no tipo de conteúdo
    const extensao = mime.extension(resposta.headers['content-type']) || '.bin';

    const outputFile = `${publicFolder}/${new Date().getTime()}.${extensao}`;
    
    // const arrayDeBytes = new Uint8Array(resposta.data);
    // const buffer = Buffer.from(arrayDeBytes);
    const buffer = Buffer.from(resposta.data);

    // Escrever o Buffer no arquivo
    fs.writeFileSync(outputFile, buffer);
    
    // Criar arquivo Simulado Tipo Multer File para não ter que criar outro envio de media
    const arquivoSimuladoTipoMulterFile = {
      fieldname: 'arquivo',
      originalname: path.basename(outputFile),
      encoding: '7bit',
      mimetype: resposta.headers['content-type'],
      destination: url,
      filename: path.basename(outputFile),
      path: outputFile,
      size: buffer.length,
      buffer: buffer,
      stream: Readable.from(buffer),
    };
    return arquivoSimuladoTipoMulterFile 
        
  } catch (erro) {
    console.error('Erro ao baixar o arquivo:', erro);
    throw new erro;
  }
}
const startChat = async (msgBody, ticket, typebot) => {
  const requestData = await TypebotService.startChat(msgBody,typebot)
  const { sessionId } = requestData
  if (sessionId) {
    await ticket.update({ 
      sessiontypebot: sessionId,
      startChatTime: new Date()
    }) 
  }
 
  return requestData
}

const continueChat = async (msgBody, ticket) => {
  return TypebotService.continueChat(msgBody, ticket.sessiontypebot)
}
  
const SendMessageReturnTypebot = async (requestData, ticket,resetChatbotMsg) => {

  const messages = requestData.messages
  for (const message of messages){
      if (message.type === 'text') {
          let formattedText = '';
          for (const richText of message.content.richText){
          for (const element of richText.children){
              let text = '';
              if (element.text) {
                  text = element.text;
              }
              if (element.bold) {
                  text = `*${text}*`;
              }
              if (element.italic) {
                  text = `_${text}_`;
              }
              if (element.underline) {
                  text = `~${text}~`;
              }
              formattedText += text;          
          }
          formattedText += '\n';
          }
          formattedText = formattedText.replace(/\n$/, '');
          
          await SendWhatsAppMessage({
            body: formattedText,
            ticket,
            quotedMsg: null
          })   
      }
      if (message.type === 'image' || message.type === 'video' || message.type === 'audio') {
          try{
            const media = await baixarESalvarArquivo(message.content.url)
            await SendWhatsAppMedia({
              media,
              ticket,
              body: media.filename
            })
           
          }catch(e){}
      }
  }
  const input = requestData.input
  if (input) {
    if (input.type === 'choice input') {
      let formattedText = '';
      const items = input.items;
      for (const item of items) {
        formattedText += `▶ ${item.content}\n`;
      }
      formattedText = formattedText.replace(/\n$/, '');
      await SendWhatsAppMessage({
        body: formattedText,
        ticket,
        quotedMsg: null
       })
      //await timer(rndInt * 1000)
    }
  }
  if (resetChatbotMsg) {
    await SendWhatsAppMessage({
      body: `*[ 00 ]* - Menu inicial`,
      ticket,
      quotedMsg: null
     })
  }
}

const handleTypebot = async (ticket: Ticket, msg: WAMessage, queue: Queue) => {
  
  let possuiSession: Boolean = true;

  const typebot = queue.publicId
  //const typebot = "pesquisa-de-satisfa";
  
  const timer = ms => new Promise(res => setTimeout(res, ms))
 
  const contentMsgboby = await getBodyMessage(msg)
  
  const rndInt = randomIntFromInterval(1, 3)
  
  await timer(rndInt * 1000)

  // await ticket.reload()
  
  possuiSession = !isNil(ticket.sessiontypebot)

  if (contentMsgboby == "00") {
    possuiSession = false;

    await ticket.update({ 
      sessiontypebot: null,
      startChatTime: null 
    }) 
  }
  
  const requestTypeBot = possuiSession 
                          ? await continueChat(contentMsgboby, ticket) 
                          : await startChat(contentMsgboby,  ticket, typebot);
  //console.log("SRequest ", requestTypeBot)         
  if (requestTypeBot) {
    delay(2000, await SendMessageReturnTypebot(requestTypeBot, ticket, queue.resetChatbotMsg))
  }
}

export default handleTypebot;
