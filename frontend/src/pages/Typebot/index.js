import React, { 
  useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import useSettings from "../../hooks/useSettings";
import { Paper, Typography } from "@material-ui/core";
import { toast } from "react-toastify"



const useStyles = makeStyles((theme) => ({
  iframe: {
    border: "none",
    //position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  noiframe: {
    display: "flex !Important",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    textAlign: "center",
  },
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%"
  },
}));

const Typebot = () => {
  const { getAll: getAllSettings } = useSettings();
  const [isSameDominio, setIsSameDominio ] = useState(false)
  const [urlTypebotBuilder, setUrlTypebotBuilder ] = useState("")

  function obterDominioSemSubdominio(url) {
    const dominioCompleto = url
  
    // Separando o domínio em partes usando o ponto como delimitador
    const partesDoDominio = dominioCompleto.split('.');
  
    // Verificando se há mais de um subdomínio
    if (partesDoDominio.length > 2) {
      // Obtendo apenas a última parte como domínio (ignorando subdomínios)
      const dominioSemSubdominio = partesDoDominio.slice(-2).join('.');
      return dominioSemSubdominio;
    } else {
      // Se não houver subdomínios, retornar o domínio completo
      return dominioCompleto;
    }
  }

  const dominioAplicacao = obterDominioSemSubdominio(window.location.hostname)


  useEffect(() => {
    async function findData() {
      try {
        
        const settingList = await getAllSettings();
        
        if (Array.isArray(settingList)) {
          const urlTypebotBuilder = settingList.find(
            (d) => d.key === "urlTypebotBuilder"
          );
          if (urlTypebotBuilder && urlTypebotBuilder.value) {
            const url = new URL(urlTypebotBuilder.value);
            const dominioDaURL = await obterDominioSemSubdominio(url.hostname);
            setIsSameDominio(dominioDaURL === dominioAplicacao);
            setUrlTypebotBuilder(urlTypebotBuilder.value)
          }
        }

      } catch (e) {
        toast .error(e);
      }
    }
    findData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classes = useStyles();
  return (
  <Paper className={classes.mainPaper}>
       {isSameDominio 
      ? (<div className={classes.iframe}>
          <iframe className={classes.iframe} src={urlTypebotBuilder}></iframe>
        </div>)
      : (<div className={classes.noiframe}>
          <img width={"250px"} height={"150px"} src={"https://saasgallery.s3.amazonaws.com/share/2021-04-28-12-09-28saasgalleryTypebot%201.jpg"} />
          <Typography variant="h5">Necessário que a instancia typebot seja do mesmo dominio para utilizar esse menu</Typography>
        </div>)    
      }
      </Paper>
  );
};

export default Typebot;