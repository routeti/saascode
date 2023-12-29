import AppError from "../../errors/AppError";
import axios, { AxiosInstance } from "axios";
import Setting from "../../models/Setting";
import ListSettingsService from "../SettingServices/ListSettingsService";

// const URLTYPEBOTBUILDER = process.env.TYPEBOT_BUILDER_URL
// const URLTYPEBOTVIEWER = process.env.TYPEBOT_VIEWER_URL

// Service Api Typebot version 2.20.0

const apiBuilder = async (companyId): Promise<AxiosInstance> => { 
    
  const SettingtokenTypebot = await ListSettingsService({ companyId })

  let urlTypebotBuilder;
  let tokenTypebot;
  
  if (Array.isArray(SettingtokenTypebot)) {
    urlTypebotBuilder = await SettingtokenTypebot.find(
      (d) => d.key === "urlTypebotBuilder"
    );
    tokenTypebot = await SettingtokenTypebot.find(
      (d) => d.key === "tokenTypebot"
    );
  }
  return axios.create({
    baseURL: urlTypebotBuilder?.value,
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${tokenTypebot?.value}`,
      Accept: "application/json"
    }
  })
}

const apiViewer = async (companyId): Promise<AxiosInstance> => { 
  
  const SettingtokenTypebot = await ListSettingsService({ companyId })

  let urlTypebotViewer;
  
  if (Array.isArray(SettingtokenTypebot)) {
    urlTypebotViewer = SettingtokenTypebot.find(
      (d) => d.key === "urlTypebotViewer"
    );
  }
  return axios.create({
    baseURL: urlTypebotViewer?.value,
    withCredentials: true,
    headers: {
      Accept: "application/json"
    }
  })
}

export const startChat = async (msgBody, typebot, companyId) => {
  const reqData = {
    message: msgBody
  };
  const api = await apiViewer(companyId)
  try {
    const request = await api.post(`/api/v1/typebots/${typebot}/startChat`, reqData);
    return request.data
  } catch (error) {
    throw new AppError("ERR_TYPEBOTS_NOT_STARTCHAT",403)
  } 
}

export const continueChat = async (msgBody, sessiontypebot, companyId) => {
  const reqData = {
    message: msgBody
  };
  const api = await apiViewer(companyId)
  try {
    const request = await api.post(`/api/v1/sessions/${sessiontypebot}/continueChat`, reqData);
    return request.data
    
  } catch (error) {
    throw new AppError("ERR_TYPEBOTS_NOT_CONTCHAT",403)
  } 
}  

export const listWorkspace = async (companyId) => {
  const api = await apiBuilder(companyId);
  try {
    const request = await api.get(`/api/v1/workspaces`);
    return request.data
    
  } catch (error) {
    console.log(error)
    throw new AppError("ERR_TYPEBOTS_NOT",403)
  } 
}

export const listTypebots = async (companyId, workspaceId) => {
  const api = await apiBuilder(companyId)
  try {
    const request = await api.get(`/api/v1/typebots`, {
      params: {
        workspaceId: workspaceId
      }
    });
    return request.data
    
  } catch (error) {
    console.log(error)
    throw new AppError("ERR_TYPEBOTS_NOT",403)
  } 
}

export const getTypebot = async (companyId, typebotId) => {
  const api = await apiBuilder(companyId)
  try {
    const request = await api.get(`/api/v1/typebots/${typebotId}`);
    return request.data
  } catch (error) {
      return null
  } 
}

export const TypebotService = {
  startChat,
  continueChat,
  listWorkspace,
  listTypebots,
  getTypebot
};

//export default ApiTypebotService;
