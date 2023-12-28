import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { head } from "lodash";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import ColorPicker from "../ColorPicker";
import {
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Switch
} from "@material-ui/core";
import { AttachFile, Colorize, DeleteOutline } from "@material-ui/icons";
import { QueueOptions } from "../QueueOptions";
import SchedulesForm from "../SchedulesForm";
import ConfirmationModal from "../ConfirmationModal";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },
  selectField: {
    marginRight: theme.spacing(1),
    flex: 1,
    minWidth: "300px"
  },
  btnWrapper: {
    position: "relative",
  },


  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },
}));

const QueueSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  color: Yup.string().min(3, "Too Short!").max(9, "Too Long!").required(),
  greetingMessage: Yup.string(),
});

const QueueModal = ({ open, onClose, queueId }) => {
  const classes = useStyles();

  const initialState = {
    name: "",
    color: "",
    greetingMessage: "",
    outOfHoursMessage: "",
    typeChatbot: "option",
    workspaceTypebot: "",
    typebotId: "",
    resetChatbotMsg: true
  };

  const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
  const [queue, setQueue] = useState(initialState);
  const [tab, setTab] = useState(0);
  const [schedulesEnabled, setSchedulesEnabled] = useState(false);
  const greetingRef = useRef();
  const [attachment, setAttachment] = useState(null);
  const attachmentFile = useRef(null);
  const [queueEditable, setQueueEditable] = useState(true);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [workspaceTypebots, setWorkspaceTypebots] = useState([]);
  const [typeBots, setTypebots] = useState([]);
  
  

  const [schedules, setSchedules] = useState([
    { weekday: "Segunda-feira",weekdayEn: "monday",startTime: "08:00",endTime: "18:00",},
    { weekday: "Terça-feira",weekdayEn: "tuesday",startTime: "08:00",endTime: "18:00",},
    { weekday: "Quarta-feira",weekdayEn: "wednesday",startTime: "08:00",endTime: "18:00",},
    { weekday: "Quinta-feira",weekdayEn: "thursday",startTime: "08:00",endTime: "18:00",},
    { weekday: "Sexta-feira", weekdayEn: "friday",startTime: "08:00",endTime: "18:00",},
    { weekday: "Sábado", weekdayEn: "saturday",startTime: "08:00",endTime: "12:00",},
    { weekday: "Domingo", weekdayEn: "sunday",startTime: "00:00",endTime: "00:00",},
  ]);

  useEffect(() => {
    api.get(`/settings`).then(({ data }) => {
      if (Array.isArray(data)) {
        const scheduleType = data.find((d) => d.key === "scheduleType");
        if (scheduleType) {
          setSchedulesEnabled(scheduleType.value === "queue");
        }
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/typebot/listworkspaces`);
        // console.log(data)
        if (data.workspaces && data.workspaces?.length > 0 ) {
          setWorkspaceTypebots(data.workspaces);
        }
      } catch (err) {
        toastError(err);
      }
    })();
  }, []);

  useEffect(() => {
    if (queueId && queue?.workspaceTypebot) {
      (async () => {
        try {
          const { data } = await api.get(`/typebot/listtypebots`, {
            params: {
              workspaceId: queue.workspaceTypebot
            }
          });
          // console.log("list ",data)
          if (data?.typebots && data?.typebots.length > 0) {
            setTypebots(data?.typebots);
           }
        } catch (err) {
          toastError(err);
        }
      })();
    }
  }, [queueId, queue]);

  useEffect(() => {
    (async () => {
      if (!queueId) return;
      try {
        const { data } = await api.get(`/queue/${queueId}`);
        setQueue((prevState) => {
          return { ...prevState, ...data };
        });
        setSchedules(data.schedules);
      } catch (err) {
        toastError(err);
      }
    })();

    return () => {
      setQueue({
        name: "",
        color: "",
        greetingMessage: "",
        typeChatbot: "option",
        workspaceTypebot: "",
        typebotId: "",
        resetChatbotMsg: true
      });
    };
  }, [queueId, open]);

  const handleClose = () => {
    onClose();
    setQueue(initialState);
  };

  const handleAttachmentFile = (e) => {
    const file = head(e.target.files);
    if (file) {
      setAttachment(file);
    }
  };

  const handleChangeWorkspace = async (workspace) => {
    console.log("work ", workspace)
    if(!workspace) {
      setTypebots([])
      return;
    }
    try {
      const { data } = await api.get(`/typebot/listtypebots`, {
        params: {
          workspaceId: workspace
        }
      });
      // console.log(data)
      if (data.typebots && data.typebots.length > 0 ) {
        setTypebots(data.typebots);
      } else {
        setTypebots([])
      }
    } catch (err) {
      toastError(err);
    }
  }

  const deleteMedia = async () => {
    if (attachment) {
      setAttachment(null);
      attachmentFile.current.value = null;
    }

    if (queue.mediaPath) {
      await api.delete(`/queue/${queue.id}/media-upload`);
      setQueue((prev) => ({ ...prev, mediaPath: null, mediaName: null }));
      toast.success(i18n.t("queueModal.toasts.deleted"));
    }
  };

  const handleSaveQueue = async (values) => {
    try {
      if (queueId) {
        await api.put(`/queue/${queueId}`, { ...values, schedules });
        if (attachment != null) {
          const formData = new FormData();
          formData.append("file", attachment);
          await api.post(`/queue/${queueId}/media-upload`, formData);
        }
      } else {
        await api.post("/queue", { ...values, schedules });
        if (attachment != null) {
          const formData = new FormData();
          formData.append("file", attachment);
          await api.post(`/queue/${queueId}/media-upload`, formData);
        }
      }
      toast.success("Queue saved successfully");
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };

  const handleSaveSchedules = async (values) => {
    toast.success("Clique em salvar para registar as alterações");
    setSchedules(values);
    setTab(0);
  };

  return (
    <div className={classes.root}>
       <ConfirmationModal
        title={i18n.t("queueModal.confirmationModal.deleteTitle")}
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={deleteMedia}
      >
        {i18n.t("queueModal.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <Dialog
        maxWidth="md"
        fullWidth={true}
        open={open}
        onClose={handleClose}
        scroll="paper"
      >
        <DialogTitle>
          {queueId
            ? `${i18n.t("queueModal.title.edit")}`
            : `${i18n.t("queueModal.title.add")}`}
           <div style={{ display: "none" }}>
            <input
              type="file"
              ref={attachmentFile}
              onChange={(e) => handleAttachmentFile(e)}
            />
          </div>
        </DialogTitle>
        <Tabs
          value={tab}
          indicatorColor="primary"
          textColor="primary"
          onChange={(_, v) => setTab(v)}
          aria-label="disabled tabs example"
        >
          <Tab label="Dados da Fila" />
          {schedulesEnabled && <Tab label="Horários de Atendimento" />}
        </Tabs>
        {tab === 0 && (
          <Paper>
            <Formik
              initialValues={queue}
              enableReinitialize={true}
              validationSchema={QueueSchema}
              onSubmit={(values, actions) => {
                setTimeout(() => {
                  handleSaveQueue(values);
                  actions.setSubmitting(false);
                }, 400);
              }}
            >
              {({ touched, errors, isSubmitting, values, setFieldValue }) => (
                <Form>
                  <DialogContent dividers>
                    <Field
                      as={TextField}
                      label={i18n.t("queueModal.form.name")}
                      autoFocus
                      name="name"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      variant="outlined"
                      margin="dense"
                      className={classes.textField}
                    />
                    <Field
                      as={TextField}
                      label={i18n.t("queueModal.form.color")}
                      name="color"
                      id="color"
                      onFocus={() => {
                        setColorPickerModalOpen(true);
                        greetingRef.current.focus();
                      }}
                      error={touched.color && Boolean(errors.color)}
                      helperText={touched.color && errors.color}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <div
                              style={{ backgroundColor: values.color }}
                              className={classes.colorAdorment}
                            ></div>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => setColorPickerModalOpen(true)}
                          >
                            <Colorize />
                          </IconButton>
                        ),
                      }}
                      variant="outlined"
                      margin="dense"
                      className={classes.textField}
                    />
                    <ColorPicker
                      open={colorPickerModalOpen}
                      handleClose={() => setColorPickerModalOpen(false)}
                      onChange={(color) => {
                        values.color = color;
                        setQueue(() => {
                          return { ...values, color };
                        });
                      }}
                    />
                    <div style={{ marginTop: 5 }}>
                          <Field
                            as={TextField}
                            label={i18n.t("queueModal.form.greetingMessage")}
                            type="greetingMessage"
                            multiline
                            inputRef={greetingRef}
                            rows={5}
                            fullWidth
                            name="greetingMessage"
                            error={
                              touched.greetingMessage &&
                              Boolean(errors.greetingMessage)
                            }
                            helperText={
                              touched.greetingMessage && errors.greetingMessage
                            }
                            variant="outlined"
                            margin="dense"
                          />
                        {schedulesEnabled && (
                            <Field
                              as={TextField}
                              label={i18n.t("queueModal.form.outOfHoursMessage")}
                              type="outOfHoursMessage"
                              multiline
                              rows={5}
                              fullWidth
                              name="outOfHoursMessage"
                              error={
                                touched.outOfHoursMessage &&
                                Boolean(errors.outOfHoursMessage)
                              }
                              helperText={
                                touched.outOfHoursMessage && errors.outOfHoursMessage
                              }
                              variant="outlined"
                              margin="dense"
                            />
                        )}
                    </div>
                    <FormControl  className={classes.selectField} margin="dense" variant="outlined" >
                      <InputLabel htmlFor="typeChatbot-selection">Tipo Chatbot</InputLabel>
                      <Field
                          as={Select}
                          id="typeChatbot-selection"
                          label="Tipo Chatbot"
                          labelId="typeChatbot-selection-label"
                          name="typeChatbot"
                          margin="dense"
                          className={classes.textField}
                        >
                          <MenuItem value="option">Opções</MenuItem>
                          <MenuItem value="typebot">Typebot</MenuItem>
                      </Field>
                    </FormControl>
                    <FormControlLabel
                        control={
                          <Field
                            as={Switch}
                            color="primary"
                            name="resetChatbotMsg"
                            checked={values.resetChatbotMsg}
                          />
                        }
                        label={i18n.t("queueModal.form.resetChatbot")}
                      />
                    {(values.typeChatbot === ""||values.typeChatbot === "option") &&  
                      <QueueOptions queueId={queueId} />
                    }
                    {values.typeChatbot === "typebot" && 
                      <div>
                          <FormControl  className={classes.selectField} margin="dense" variant="outlined" >
                              <InputLabel htmlFor="workspaceTypebot-selection">Workspaces</InputLabel>
                              <Field
                                  as={Select}
                                  id="workspaceTypebot-selection"
                                  label="workSpaces"
                                  labelId="workspaceTypebot-selection-label"
                                  name="workspaceTypebot"
                                  onChange={e => { 
                                    setFieldValue('workspaceTypebot', e.target?.value)
                                    handleChangeWorkspace(e.target?.value)
                                  }}
                                  margin="dense"
                                  className={classes.textField}
                                >
                                  <MenuItem value={''}>&nbsp;</MenuItem>
                                  {workspaceTypebots.map((workspace, key) => (
                                    <MenuItem key={key} value={workspace.id}>{workspace.name}</MenuItem>
                                  ))}
                                  
                          </Field>
                          </FormControl>
                          <FormControl  className={classes.selectField} margin="dense" variant="outlined">
                            <InputLabel htmlFor="typebotId-selection">TypeBot</InputLabel>
                            <Field
                                as={Select}
                                id="typebot-selection"
                                label="Typebot"
                                labelId="typebot-selection-label"
                                name="typebotId"
                                margin="dense"
                                className={classes.textField}
                              >
                                <MenuItem value={''}>&nbsp;</MenuItem>
                                {typeBots.map((typebot, key) => (
                                    <MenuItem key={key} value={typebot.id}>{typebot.name}</MenuItem>
                                  ))}
                              </Field>
                          </FormControl>
                      </div> 
                    }
                     
                    {(queue.mediaPath || attachment) && (
                    <Grid xs={12} item>
                      <Button startIcon={<AttachFile />}>
                        {attachment != null
                          ? attachment.name
                          : queue.mediaName}
                      </Button>
                      {queueEditable && (
                        <IconButton
                          onClick={() => setConfirmationOpen(true)}
                          color="secondary"
                        >
                          <DeleteOutline />
                        </IconButton>
                      )}
                    </Grid>
                  )}
                  </DialogContent>
                  <DialogActions>
                    {!attachment && !queue.mediaPath && queueEditable && (
                      <Button
                        color="primary"
                        onClick={() => attachmentFile.current.click()}
                        disabled={isSubmitting}
                        variant="outlined"
                      >
                        {i18n.t("queueModal.buttons.attach")}
                      </Button>
                    )}
                    <Button
                      onClick={handleClose}
                      color="secondary"
                      disabled={isSubmitting}
                      variant="outlined"
                    >
                      {i18n.t("queueModal.buttons.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      color="primary"
                      disabled={isSubmitting}
                      variant="contained"
                      className={classes.btnWrapper}
                    >
                      {queueId
                        ? `${i18n.t("queueModal.buttons.okEdit")}`
                        : `${i18n.t("queueModal.buttons.okAdd")}`}
                      {isSubmitting && (
                        <CircularProgress
                          size={24}
                          className={classes.buttonProgress}
                        />
                      )}
                    </Button>
                  </DialogActions>
                </Form>
              )}
            </Formik>
          </Paper>
        )}
        {tab === 1 && (
          <Paper style={{ padding: 20 }}>
            <SchedulesForm
              loading={false}
              onSubmit={handleSaveSchedules}
              initialValues={schedules}
              labelSaveButton="Adicionar"
            />
          </Paper>
        )}
      </Dialog>
    </div>
  );
};

export default QueueModal;
