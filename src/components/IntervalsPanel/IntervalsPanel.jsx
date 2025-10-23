import {Container, Paper, Text, Stack, Grid, ThemeIcon, Table, Group, Button, TextInput, ColorPicker, Menu, Box, Popover, MultiSelect, SegmentedControl, Select, DrawerTitle, Slider, Checkbox, Modal} from '@mantine/core';
import {BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine} from 'recharts';
import {PieChart} from "@mantine/charts";
import {IconCalendarWeek, IconFilter, IconEdit, IconLayoutBottombarCollapse, IconLayoutBottombarExpand, IconLayoutRows, IconX} from '@tabler/icons-react';
import {useState, useEffect} from "react";
import {editPunch, deletePunch, insertPunch} from "../../services/punchesService";
import {useDisclosure} from '@mantine/hooks';
import {useForm} from '@mantine/form';
import {DatePicker, DateTimePicker} from '@mantine/dates';
import '@mantine/dates/styles.css';
import "./IntervalsPanel.css";

export default function IntervalsPanel(props) {
  const [graphicIntervals, setGraphicIntervals] = useState([[]]);
  const [selectedElementInfo, setSelectedElementInfo] = useState();
  const [mousePos, setMousePos] = useState(0);
  const [intervalInfoOpen, setIntervalInfoOpen] = useState(false);
  const [editDialogOpened, editDialogHandlers] = useDisclosure(false);
  const [editModalState, setEditModalState] = useState();
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(24);
  const [viewSelection, setViewSelection] = useState("Graph");
  const [selectedDate, setSelectedDate] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
  const [selectedDateList, setSelectedDateList] = useState([selectedDate]);
  const [filterSelection, setFilterSelection] = useState(props.timecodes.map(x => x.id));
  const [intervalSumData, setIntervalSumData] = useState([]);

  const times = [].concat(["12am"], [...Array(11).keys()].map(x => (x + 1) + "am"), ["12pm"], [...Array(11).keys()].map(x => (x + 1) + "pm"));

  useEffect(() => {
    setGraphicIntervals(selectedDateList.map(date => loadGraphicIntervals(date)));
    console.log(selectedDateList.map(date => loadGraphicIntervals(date)));
    loadIntervalSumData();
  }, [startTime, endTime, props.intervals, props.timecodes, selectedDateList, filterSelection, props.minute]);

  function loadGraphicIntervals(date) {
    let intervalWrapsStart = false;
    let intervalWrapsEnd = false;

    const barchartBars = []

    const d = new Date(date);
    const n = new Date(new Date(date).setHours(24, 0, 0 ,0) - 1);

    props.intervals.filter(x => x.endtime > d && x.starttime < n).forEach(x => {
      const graphicInterval = {interval: x, starttimeoffset: (x.starttime - d) / 3600000, endtimeoffset: (x.endtime - d) / 3600000}

      if(graphicInterval.starttimeoffset <= startTime) {
        graphicInterval.starttimeoffset = startTime;
        intervalWrapsStart = true;
      }
      if(graphicInterval.endtimeoffset >= endTime) {
        graphicInterval.endtimeoffset = endTime;
        intervalWrapsEnd = true;
      }
      barchartBars.push(graphicInterval);
    });

    if(barchartBars.length === 0) {
      barchartBars.push({starttimeoffset: startTime, endtimeoffset: endTime});
    }
    else {
      if (!intervalWrapsStart) {
        barchartBars.push({starttimeoffset: startTime, endtimeoffset: barchartBars[barchartBars.length - 1].starttimeoffset});
      }
      barchartBars.reverse();
      if (!intervalWrapsEnd) {
        barchartBars.push({starttimeoffset: barchartBars[barchartBars.length - 1].endtimeoffset, endtimeoffset: endTime});
      }
    }
    return barchartBars;
  }

  function loadIntervalSumData() {
    const data = {};
    data[-1] = {name: "Deleted Interval", value: 0, color: "gray"};
    
    const sumStart = selectedDateList[0];

    const currentTime = new Date();
    const filterEnd = new Date(new Date(selectedDateList[selectedDateList.length - 1]).setHours(24, 0, 0, 0) - 1);
    const sumEnd = filterEnd < currentTime ? filterEnd : currentTime;

    let arr = props.intervals.slice();
    if(arr.length > 0) {
      arr[0].endtime = currentTime;
    }
    arr = arr.filter(x => x.timecodes_id !== 0 && x.endtime > sumStart && x.starttime < sumEnd);

    if(arr.length > 0) {
      if(arr[0].starttime < sumStart) {
        arr[0].starttime = sumStart;
      }
      if(arr[arr.length - 1].endtime > sumEnd) {
        arr[arr.length - 1].endtime = sumEnd;
      }
    }

    props.timecodes.forEach(x => data[x.id] = {name: x.name, value: 0, color: "#" + x.hexcolor});

    let sumTotal = 0;

    arr.forEach(x => {
      const length = (x.endtime - x.starttime) / 3600000;
      sumTotal += length;
      if(!data[x.timecodes_id]) {
        data[-1].value += length;
      }
      else {
        data[x.timecodes_id].value += length;
      }
    })
    data[0] = {name: "Not Tracked", value: ((sumEnd - sumStart) / 3600000) - sumTotal, color: "black"};
    setIntervalSumData(Object.values(data).filter(x => x.value > 0));
  }

  function handleClick(data, index, e) {
    const interval = graphicIntervals.flat()[data.tooltipPayload[0].dataKey].interval;

    setSelectedElementInfo(interval);
    setMousePos(e.pageY);
    setIntervalInfoOpen(true);
  }

  function handleClose(event) {
    setIntervalInfoOpen(false);
  }

  function calcReferenceLine() {
    let d = new Date();
    let dZero = new Date();
    dZero.setHours(0, 0, 0, 0);
    return (d - dZero) / 3600000;
  }

  function handleEditPunch(punch) {
    form.reset();
    setEditModalState("edit");
    setSelectedElementInfo(punch);
    form.getInitialValues().starttime = punch.starttime;
    form.getInitialValues().endtime = punch.endtime;
    form.getInitialValues().timecodes_id = punch.timecodes_id.toString();
    form.getInitialValues().note = punch.note;
    editDialogHandlers.open();
  }

  function handleSplit(punch) {
    form.reset();
    setEditModalState("split");
    setSelectedElementInfo(punch);
    form.getInitialValues().timestamp = new Date(((punch.endtime.getTime() - punch.starttime.getTime()) / 2) + punch.starttime.getTime());
    form.getInitialValues().timestamp_slider = 50;
    form.getInitialValues().note_1 = punch.note;
    form.getInitialValues().note_2 = punch.note;
    form.getInitialValues().timecodes_id_1 = punch.timecodes_id.toString();
    form.getInitialValues().timecodes_id_2 = punch.timecodes_id.toString();
    editDialogHandlers.open();
  }

  function handleMergeAbove(punch) {
    form.reset();
    setEditModalState("mergeAbove");
    setSelectedElementInfo(punch);
    form.getInitialValues().timecodes_id = punch.timecodes_id.toString();
    form.getInitialValues().note = punch.note;
    editDialogHandlers.open();
  }

  function handleMergeBelow(punch) {
    form.reset();
    setEditModalState("mergeBelow");
    setSelectedElementInfo(punch);
    form.getInitialValues().timecodes_id = punch.timecodes_id.toString();
    form.getInitialValues().note = punch.note;
    editDialogHandlers.open();
  }

  function handleAdd() {
    form.reset();
    setEditModalState("add");
    form.getInitialValues().starttime = new Date(new Date().setHours(0, 0, 0, 0));
    form.getInitialValues().endtime = new Date(new Date().setHours(0, 0, 0, 0));
    editDialogHandlers.open();
  }

  function handleDelete(punch) {
    setEditModalState("delete");
    setSelectedElementInfo(punch);
    editDialogHandlers.open();
  }

  function handleEditPunchSubmit(values) {
    const arr = props.intervals.slice();

    deleteHelperFn(arr);
    addHelperFn(arr, values);
  
    props.setIntervals(arr);
    setIntervalInfoOpen(false);
  }

  function handleSplitSubmit(values) {
    const arr = props.intervals.slice();
    const idx = arr.indexOf(selectedElementInfo);
    
    editPunch(arr[idx].id, {timecodes_id: Number(values.timecodes_id_1), note: values.note_1, user_id: props.loggedInUser.id});
    insertPunch({timecodes_id: Number(values.timecodes_id_2), note: values.note_2, timestamp: Date.parse(values.timestamp) / 1000, user_id: props.loggedInUser.id}).then(result => {
      const IdArr = arr.slice(); 
      IdArr[idx].id = result[0].id; 
      props.setIntervals(IdArr);
    });
    
    arr[idx].timecodes_id = Number(values.timecodes_id_1);
    arr[idx].note = values.note_1;
    const oldEndTime = arr[idx].endtime;
    arr[idx].endtime = new Date(values.timestamp);
    arr.splice(idx, 0, {timecodes_id: Number(values.timecodes_id_2), note: values.note_2, starttime: new Date(Date.parse(values.timestamp)), endtime: oldEndTime, user_id: props.loggedInUser.id});

    props.setIntervals(arr);
    setIntervalInfoOpen(false);
  }

  function handleMergeAboveSubmit(values) {
    const arr = props.intervals.slice();
    const idx = arr.indexOf(selectedElementInfo);

    editPunch(arr[idx].id, {timecodes_id: Number(values.timecodes_id), note: values.note, user_id: props.loggedInUser.id});
    deletePunch(arr[idx - 1].id, props.loggedInUser.id);

    arr[idx].timecodes_id = Number(values.timecodes_id);
    arr[idx].note = values.note;
    arr[idx].endtime = arr[idx - 1].endtime;
    arr.splice(idx - 1, 1);
    
    props.setIntervals(arr);
    setIntervalInfoOpen(false);
  }

  function handleMergeBelowSubmit(values) {
    const arr = props.intervals.slice();
    const idx = arr.indexOf(selectedElementInfo);

    editPunch(arr[idx].id, {timestamp: arr[idx + 1].starttime / 1000, timecodes_id: Number(values.timecodes_id), note: values.note, user_id: props.loggedInUser.id});
    deletePunch(arr[idx + 1].id, props.loggedInUser.id);

    arr[idx].timecodes_id = Number(values.timecodes_id);
    arr[idx].note = values.note;
    arr[idx].starttime = arr[idx + 1].starttime;
    arr.splice(idx + 1, 1);
  
    props.setIntervals(arr);
    setIntervalInfoOpen(false);
  }

  function handleAddSubmit(values) {
    const arr = props.intervals.slice();

    addHelperFn(arr, values);

    props.setIntervals(arr);
    setIntervalInfoOpen(false);
  }

  function addHelperFn(arr, values) {
    const idx = arr.findIndex(x => x.starttime <= values.starttime) === -1 ? arr.length : arr.findIndex(x => x.starttime <= values.starttime);

    if(idx > 0 && arr[idx - 1].starttime.getTime() === values.endtime.getTime() && idx < arr.length - 1 && arr[idx + 1].endtime.getTime() === values.starttime.getTime()) {
      //touching above and below ivls
      editPunch(arr[idx].id, {timecodes_id: Number(values.timecodes_id), note: values.note, user_id: props.loggedInUser.id});
      arr[idx].timecodes_id = Number(values.timecodes_id);
      arr[idx].note = values.note;
    }
    else if(idx > 0 && arr[idx - 1].starttime.getTime() === values.endtime.getTime()) {
      // touching above ivl
      insertPunch({timecodes_id: Number(values.timecodes_id), note: values.note, timestamp: values.starttime / 1000, user_id: props.loggedInUser.id}).then(result => {const IdArr = arr.slice(); IdArr[idx].id = result[0].id; props.setIntervals(IdArr);});
      arr[idx].endtime = values.starttime;
      arr.splice(idx, 0, {timecodes_id: Number(values.timecodes_id), note: values.note, starttime: values.starttime, endtime: values.endtime, user_id: props.loggedInUser.id});
    }
    else if(idx < arr.length - 1 && arr[idx + 1].endtime.getTime() === values.starttime.getTime()) {
      // touching below ivl
      editPunch(arr[idx].id, {timecodes_id: Number(values.timecodes_id), note: values.note, user_id: props.loggedInUser.id});
      insertPunch({timecodes_id: 0, timestamp: values.endtime / 1000, user_id: props.loggedInUser.id}).then(result => {const IdArr = arr.slice(); IdArr[idx].id = result[0].id; props.setIntervals(IdArr);});
      const oldEndTime = arr.length > 0 ? arr[idx].endtime : new Date();
      arr[idx].timecodes_id = Number(values.timecodes_id);
      arr[idx].note = values.note;
      arr[idx].endtime = values.endtime;
      arr.splice(idx, 0, {timecodes_id: 0, starttime: values.endtime, endtime: oldEndTime, user_id: props.loggedInUser.id});
    }
    else {
      // floating ivl
      Promise.all([insertPunch({timecodes_id: Number(values.timecodes_id), note: values.note, timestamp: values.starttime / 1000, user_id: props.loggedInUser.id}), insertPunch({timecodes_id: 0, timestamp: values.endtime / 1000, user_id: props.loggedInUser.id})]).then(result => {
        const IdArr = arr.slice(); IdArr[idx].id = result[1][0].id; IdArr[idx + 1].id = result[0][0].id; props.setIntervals(IdArr);
      })
      const oldEndTime = idx > 0 ? arr[idx - 1].starttime : new Date();
      if(idx < arr.length - 1) {
        arr[idx].endtime = values.starttime;
      }
      arr.splice(idx, 0, {timecodes_id: Number(values.timecodes_id), note: values.note, starttime: values.starttime, endtime: values.endtime, user_id: props.loggedInUser.id});
      arr.splice(idx, 0, {timecodes_id: 0, starttime: values.endtime, endtime: oldEndTime, user_id: props.loggedInUser.id});
    }
  }

  function handleDeleteSubmit() {
    const arr = props.intervals.slice();
    
    deleteHelperFn(arr);

    props.setIntervals(arr);
    setIntervalInfoOpen(false);
  }

  function deleteHelperFn(arr) {
    const idx = arr.indexOf(selectedElementInfo);

    if(idx === (arr.length - 1)) {
      deletePunch(arr[idx].id, props.loggedInUser.id);
      arr.splice(idx, 1);
    }
    else if(arr[idx + 1].timecodes_id === 0) {
      deletePunch(arr[idx].id, props.loggedInUser.id);
      const oldEndTime = arr[idx].endtime;
      arr.splice(idx, 1);
      arr[idx].endtime = oldEndTime;
    }
    else {
      editPunch(arr[idx].id, {timecodes_id: 0, user_id: props.loggedInUser.id});
      arr[idx].timecodes_id = 0;
    }

    if(idx > 0 && arr[idx - 1].timecodes_id === 0) {
      if(idx === arr.length) {
        deletePunch(arr[idx - 1].id, props.loggedInUser.id);
        arr.splice(idx - 1, 1);
      }
      else {
        deletePunch(arr[idx - 1].id, props.loggedInUser.id);
        const oldEndTime = arr[idx - 1].endtime;
        arr.splice(idx - 1, 1);
        arr[idx - 1].endtime = oldEndTime;
      }
    }
  }

  function customizedGroupTick(props) {
    const {index, x, y, payload} = props;
    return <text x={x - 50} y={y}>{times[payload.value]}</text>;
  };

  function handleViewSelectionChange(value) {
    setViewSelection(value);
  }

  // Might user as some point.
  // function handleUpperBoundaryChange(value) {
  //   setEndTime(new Date(new Date().setHours(Number(value), 0, 0, 0) - 1));
  // }

  // function handleLowerBoundaryChange(value) {
  //   setStartTime(new Date(new Date().setHours(Number(value), 0, 0, 0)));
  // }

  function handleChangeFilter(val) {
    console.log("filter");
  }

  function handleDateChange(val) {
    console.log(val);
    boundaryForm.getInitialValues().date = val;
    setSelectedDate(new Date(new Date(val).setHours(0, 0, 0, 0)));
    generateDateList(selectedDateList.length, val);
  }

  function handleDateRangeChange(val) {
    if(val === "Past Day") {
      generateDateList(1, selectedDate);
    }
    else if(val === "Past 2 Days") {
      generateDateList(2, selectedDate);
    }
    else if(val === "Past 3 Days") {
      generateDateList(3, selectedDate);
    }
    else if(val === "Past 4 Days") {
      generateDateList(4, selectedDate);
    }
  }

  function generateDateList(numDays, date) {
    const newDateArr = Array.from({length: numDays}).map((_, idx) => new Date(new Date(date).setHours(-(numDays - idx - 1) * 24, 0, 0, 0)));
    setSelectedDateList(newDateArr);
  }

  function handleValidation(values) {
    const arr = props.intervals.filter(x => x.timecodes_id !== 0);
    const idx = arr.indexOf(selectedElementInfo);

    if(editModalState === "edit") {
      arr.splice(idx, 1);
    }

    const validationText = {};
    
    switch(editModalState) {
      case "delete": 
        break;
      case "split":
        if(values.timestamp >= arr[idx].endTime) {
          validationText.timestamp = "Interval split intersects with start time.";
        }
        else if (values.timestamp <= arr[idx].starttime) {
          validationText.timestamp = "Interval split intersects with end time.";
        }
        if(!values.timecodes_id_1) {
          validationText.timecodes_id_1 = "Must select a timecode."
        }
        if(!values.timecodes_id_2) {
          validationText.timecodes_id_2 = "Must select a timecode."
        }
        break;
      case "edit":
      case "add":
        if(values.starttime >= values.endtime) {
          validationText.starttime = "End time must occur after start time."
          validationText.endtime = "End time must occur after start time.";
        }
        const startIdx = arr.findIndex(x => x.starttime < values.starttime) === -1 ? arr.length : arr.findIndex(x => x.starttime < values.starttime);
        const endIdx = arr.findIndex(x => x.starttime < values.endtime) === -1 ? arr.length : arr.findIndex(x => x.starttime < values.endtime);

        if(startIdx < arr.length && values.starttime < arr[startIdx].endtime) {
          validationText.starttime = "Start time intersects with previous interval(s).";
        }
        if(endIdx !== startIdx || (arr.length != 0 && startIdx < arr.length && values.endtime < arr[endIdx].endtime)) {
          validationText.endtime = "End time intersects with future interval(s).";
        }
        if(values.starttime > new Date()) {
          validationText.starttime = "Start time cannot be in the future.";
        }
        if(values.starttime > new Date()) {
          validationText.endtime = "End time cannot be in the future.";
        }
      case "mergeAbove":
      case "mergeBelow":
        if(!values.timecodes_id) {
          validationText.timecodes_id = "Must select a timecode."
        }
    }
    if(Object.keys(validationText).length === 0) {
      editDialogHandlers.close();
    }
    return validationText;
  }

  function ModalConfirmBtns() {
    return (              
      <Group justify="space-between">
        <Button variant="filled" className="btn" id="cancel-btn" onClick={() => editDialogHandlers.close()}>Cancel</Button>
        <Button variant="filled" className="btn" id="save-btn" type="submit">Save</Button>
      </Group>
    );
  }

  function IntervalInfoBox({ivl}) {
    return (<Stack>
      <Text size={30} lh="30px" c={props.timecodes.find(y => y.id === ivl.timecodes_id) !== undefined ? "#" + props.timecodes.find(y => y.id === ivl.timecodes_id).hexcolor : "#000000"}>{props.timecodes.find(y => y.id === ivl.timecodes_id) !== undefined ? props.timecodes.find(y => y.id === ivl.timecodes_id).name : "Deleted Timecode"}</Text>
      <Text><b>Start</b> {new Date(ivl.starttime).toLocaleString([], {hour12: true, timeZoneName:"short"})}</Text>
      <Text><b>End</b> {new Date(ivl.endtime).toLocaleString([], {hour12: true, timeZoneName:"short"})}</Text>
      <Group grow wrap="nowrap" align="start">
        <Stack>
          <Group wrap="nowrap"><IconEdit color="var(--mantine-color-blue-3)"/><Text c="var(--mantine-color-blue-3)" style={{cursor:"pointer"}} onClick={() => handleEditPunch(ivl)}>Edit Punch</Text></Group>
          <Group wrap="nowrap"><IconLayoutRows color="var(--mantine-color-blue-3)"/><Text c="var(--mantine-color-blue-3)" style={{cursor:"pointer"}} onClick={() => handleSplit(ivl)}>Split Interval</Text></Group>
          <Group wrap="nowrap"><IconX color="var(--mantine-color-red-3)"/><Text c="var(--mantine-color-red-3)" style={{cursor:"pointer"}} onClick={() => handleDelete(ivl)}>Delete</Text></Group>
        </Stack>
        <Stack>
          {props.intervals.indexOf(ivl) !== 0 && <Group wrap="nowrap"><IconLayoutBottombarExpand color="var(--mantine-color-blue-3)"/><Text c="var(--mantine-color-blue-3)" style={{cursor:"pointer"}} onClick={() => handleMergeAbove(ivl)}>Merge With Above Interval</Text></Group>}
          {props.intervals.indexOf(ivl) !== props.intervals.length - 1 && <Group wrap="nowrap"><IconLayoutBottombarCollapse color="var(--mantine-color-blue-3)"/><Text c="var(--mantine-color-blue-3)" style={{cursor:"pointer"}} onClick={() => handleMergeBelow(ivl)}>Merge With Below Inerval</Text></Group>}
        </Stack>
      </Group>
      <Button variant="filled" className="btn" id="cancel-btn" onClick={handleClose}>Close</Button>
    </Stack>);
  }

  const boundaryForm = useForm({mode:"uncontrolled"});
  boundaryForm.getInitialValues().start = "0";
  boundaryForm.getInitialValues().end = "24";
  boundaryForm.getInitialValues().date = new Date(new Date().setHours(0, 0, 0, 0));
  boundaryForm.getInitialValues().dateRange = "Past Day";

  const form = useForm({mode:"uncontrolled", validate:handleValidation});

  return (
    <>
      <Modal radius="xl" size="auto" opened={editDialogOpened} onClose={editDialogHandlers.close} flex centered withCloseButton={false}>
        <Container>
          {editModalState === "edit" && <form onSubmit={form.onSubmit(handleEditPunchSubmit)}>
            <Stack>
              <DateTimePicker timePickerProps={{format:"12h"}} withSeconds={true} valueFormat="MM/DD/YYYY hh:mm:ss A" label="New Start Time" key={form.key('starttime')} {...form.getInputProps('starttime')} onChange={(v) => form.getInputProps("starttime").onChange(new Date(Date.parse(v)))}/>
              <DateTimePicker timePickerProps={{format:"12h"}} withSeconds={true} valueFormat="MM/DD/YYYY hh:mm:ss A" label="New End Time" key={form.key('endtime')} disabled={props.intervals.indexOf(selectedElementInfo) === 0} {...form.getInputProps('endtime')} onChange={(v) => form.getInputProps("endtime").onChange(new Date(Date.parse(v)))}/>
              <Select label="Select Timecode" data={props.timecodes.map(x => ({value:x.id.toString(), label:x.name}))} key={form.key('timecodes_id')} {...form.getInputProps('timecodes_id')}/>
              <TextInput label="Note" key={form.key('note')} {...form.getInputProps('note')}/>
              <ModalConfirmBtns/>
            </Stack>
          </form>}

          {editModalState==="split" && <form onSubmit={form.onSubmit(handleSplitSubmit)}>
            <Stack>
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text>First Interval</Text>
                  <Text>Starting at: {new Date(selectedElementInfo.starttime).toLocaleString()}</Text>
                  <TextInput label="Add a Note" placeholder="Note" key={form.key('note_1')} {...form.getInputProps('note_1')}/>
                  <Select label="Select Timecode" data={props.timecodes.map(x => ({value:x.id.toString(), label:x.name}))} key={form.key('timecodes_id_1')} {...form.getInputProps('timecodes_id_1')}/>
                </div>
                <div>
                  <Text>Second Interval</Text>
                  <Text>Ending at: {new Date(selectedElementInfo.endtime).toLocaleString()}</Text>
                  <TextInput label="Add a Note" placeholder="Note" key={form.key('note_2')} {...form.getInputProps('note_2')}/>
                  <Select label="Select Timecode" data={props.timecodes.map(x => ({value:x.id.toString(), label:x.name}))} key={form.key('timecodes_id_2')} {...form.getInputProps('timecodes_id_2')}/>
                </div>
              </Group>
              <DateTimePicker timePickerProps={{format:"12h"}} withSeconds={true} valueFormat="MM/DD/YYYY hh:mm:ss A" label="Split Interval" key={form.key('timestamp')} {...form.getInputProps('timestamp')} onChange={(v) => {console.log((Date.parse(v) - selectedElementInfo.starttime) / (selectedElementInfo.endtime - selectedElementInfo.starttime) * 100); form.setFieldValue("timestamp_slider", ((new Date(Date.parse(v)).getTime() - selectedElementInfo.starttime.getTime()) / (selectedElementInfo.endtime.getTime() - selectedElementInfo.starttime.getTime())) * 100); form.getInputProps("timestamp").onChange(new Date(Date.parse(v)))}}/>
              <Slider label={null} key={form.key('timestamp_slider')} {...form.getInputProps('timestamp_slider')} onChange={(v) => {console.log(((v / 100) * (Date.parse(selectedElementInfo.endtime) - Date.parse(selectedElementInfo.starttime))) + Date.parse(selectedElementInfo.starttime)); form.setFieldValue("timestamp", new Date((((v / 100) * (selectedElementInfo.endtime.getTime() - selectedElementInfo.starttime.getTime()))) + selectedElementInfo.starttime.getTime()))}}/>
              <ModalConfirmBtns/>
            </Stack>
          </form>}

          {editModalState === "mergeAbove" && <form onSubmit={form.onSubmit(handleMergeAboveSubmit)}>
            <Stack>
              <Text>Starting at: {new Date(selectedElementInfo.starttime).toLocaleString()}</Text>
              {props.intervals[props.intervals.indexOf(selectedElementInfo) - 1] && <Text>Ending at: {new Date(props.intervals[props.intervals.indexOf(selectedElementInfo) - 1].endtime).toLocaleString()}</Text>}
              <Select label="Select Timecode" data={props.timecodes.map(x => ({value:x.id.toString(), label:x.name}))} key={form.key('timecodes_id')} {...form.getInputProps('timecodes_id')}/>
              <TextInput label="Add a Note" placeholder="Note" key={form.key('note')} {...form.getInputProps('note')}/>
              <ModalConfirmBtns/>
            </Stack>
          </form>}

          {editModalState === "mergeBelow" && <form onSubmit={form.onSubmit(handleMergeBelowSubmit)}>
            <Stack>
              {props.intervals[props.intervals.indexOf(selectedElementInfo) + 1] && <Text>Starting at: {new Date(props.intervals[props.intervals.indexOf(selectedElementInfo) + 1].starttime).toLocaleString()}</Text>}
              <Text>Ending at: {new Date(selectedElementInfo.endtime).toLocaleString()}</Text>
              <Select label="Select Timecode" data={props.timecodes.map(x => ({value:x.id.toString(), label:x.name}))} key={form.key('timecodes_id')} {...form.getInputProps('timecodes_id')}/>
              <TextInput label="Add a Note" placeholder="Note" key={form.key('note')} {...form.getInputProps('note')}/>
              <ModalConfirmBtns/>
            </Stack>
          </form>}
          
          {editModalState === "delete" && <form onSubmit={form.onSubmit(handleDeleteSubmit)}>
            <Stack>
              <Text>Are you sure you would like to delete this interval?</Text>
              <ModalConfirmBtns/>
            </Stack>
          </form>}

          {editModalState === "add" && <form onSubmit={form.onSubmit(handleAddSubmit)}>
            <Stack>
              <DateTimePicker timePickerProps={{format:"12h"}} withSeconds={true} valueFormat="MM/DD/YYYY hh:mm:ss A" label="New Start Time" key={form.key('starttime')} {...form.getInputProps('starttime')} onChange={(v) => form.getInputProps("starttime").onChange(new Date(Date.parse(v)))}/>
              <DateTimePicker timePickerProps={{format:"12h"}} withSeconds={true} valueFormat="MM/DD/YYYY hh:mm:ss A" label="New End Time" key={form.key('endtime')} {...form.getInputProps('endtime')} onChange={(v) => form.getInputProps("endtime").onChange(new Date(Date.parse(v)))}/>
              <Select label="Select Timecode" data={props.timecodes.map(x => ({value:x.id.toString(), label:x.name}))} key={form.key('timecodes_id')} {...form.getInputProps('timecodes_id')}/>
              <TextInput label="Note" key={form.key('note')} {...form.getInputProps('note')}/>
              <ModalConfirmBtns/>
            </Stack>
          </form>}
        </Container>
      </Modal>

      {intervalInfoOpen && <Stack align="center"> 
        <Paper shadow="xl" radius="xl" p="xl" w={500} pos="absolute" top={mousePos + 50} style={{zIndex:5}}>
          <IntervalInfoBox ivl={selectedElementInfo}/>
        </Paper>
      </Stack>}

      <Paper shadow="xl" radius="xl" p="xl">
          <Group justify="space-between" wrap="nowrap">
            <Group wrap="nowrap">
              <Button variant="filled" className="btn" id="add-btn" onClick={handleAdd}>+</Button>

              <Popover width={200} id="edit-btn-2">
                <Popover.Target>
                  <Button variant="filled" className="btn" onClick={handleChangeFilter}><IconFilter/></Button>
                </Popover.Target>
                <Popover.Dropdown>
                  <Text c="var(--mantine-color-blue-3)" style={{cursor: "pointer"}} onClick={() => setFilterSelection(props.timecodes.map(x => x.id))}>Check All</Text>
                  <Text c="var(--mantine-color-blue-3)" style={{cursor: "pointer"}} onClick={() => setFilterSelection(["foo"]) }>Uncheck All</Text>
                  {props.timecodes.map((x, idx) => 
                    <Group justify="space-between">
                      <Text>{x.name}</Text>
                      <Checkbox checked={filterSelection.find(y => x.id === y) !== undefined} onChange={() => {
                        const arr = filterSelection.slice(); 
                        const idx = arr.indexOf(x.id);
                        if (idx === -1) {
                          arr.push(x.id);
                        }
                        else {
                          arr.splice(idx, 1);
                        }
                        setFilterSelection(arr)}
                      }/>
                    </Group>)}
                </Popover.Dropdown>
              </Popover>
              
              <Popover id="edit-btn-2">
                <Popover.Target>
                  <Button variant="filled" className="btn" id="edit-btn-2"><IconCalendarWeek/></Button>
                </Popover.Target>
                <Popover.Dropdown>
                  <DatePicker label="New Date" key={boundaryForm.key('date')} {...boundaryForm.getInputProps('date')} onChange={(v) => handleDateChange(new Date(Date.parse(v) + (new Date().getTimezoneOffset() * 60000)))}/>
                </Popover.Dropdown>
              </Popover>
              <form>
                <Select classNames={{input:"select"}}  id="dateRangeSelect" key={boundaryForm.key('dateRange')} data={["Past Day", "Past 2 Days", "Past 3 Days", "Past 4 Days"]} {...boundaryForm.getInputProps('dateRange')}  onChange={handleDateRangeChange}/>
              </form> 
            </Group>
    
            <SegmentedControl data={["Graph", "List", "Pie"]} radius="xl" size="md" onChange={handleViewSelectionChange}/>
          </Group>
        {viewSelection === "Graph" && <><ResponsiveContainer width="100%" height={600}>
          <BarChart barCategoryGap={0} data={[graphicIntervals.map(graphicIntervalArr => graphicIntervalArr.map(x => (x.endtimeoffset - x.starttimeoffset))).flat()]}>
            {graphicIntervals.map((date, date_idx) => graphicIntervals[date_idx].map((x, idx) => [date_idx, x])).flat().map((x, idx) => x[1].interval === undefined || x[1].interval.timecodes_id === 0 || (props.timecodes.find(y => y === x[1].interval.timecodes_id) !== undefined && !filterSelection.find(y => y === x[1].interval.timecodes_id))
              ? <Bar dataKey={idx} stackId={x[0]} fill="transparent" cursor="default"/> 
              : <Bar dataKey={idx} stackId={x[0]} fill={props.timecodes.find(y => y.id === x[1].interval.timecodes_id) === undefined ? "#000000" : "#" + props.timecodes.find(y => y.id === x[1].interval.timecodes_id).hexcolor} cursor="pointer" onClick={handleClick} radius={20}/>)}
            <CartesianGrid vertical={false}/>
            <YAxis 
              type="number"
              interval={0}
              ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].filter(x => (x >= startTime && x <= endTime))}
              tick={customizedGroupTick}
              domain={[startTime, endTime]}
              allowDataOverflow={true}
            />
            <ReferenceLine y={calcReferenceLine()} stroke="red"/>
          </BarChart>
        </ResponsiveContainer>
        <Group pl="60px" pr="10px" justify='space-around'>{selectedDateList.map(x => <Text>{x.toLocaleDateString()}</Text>)}</Group>
        </>}

        {viewSelection === "List" && props.timecodes && <Stack>
          {Array.from(props.intervals.values()).filter(x => x.timecodes_id !== 0).map(x => 
            <IntervalInfoBox ivl={x}/>
          )}
          </Stack>}

          {viewSelection === "Pie" && props.timecodes && <Group wrap="nowrap">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart
                data={intervalSumData}
              />
            </ResponsiveContainer>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Timecode</Table.Th>
                  <Table.Th>Hours Tracked</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {intervalSumData.map(x => 
                <Table.Tr key={x.name}>
                  <Table.Td>{x.name}</Table.Td>
                  <Table.Td>{Math.floor(x.value) + "hr " + Math.floor((x.value % 1) * 60) + "min"}</Table.Td>
                </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Group>}
      </Paper>
    </>
  );
}
