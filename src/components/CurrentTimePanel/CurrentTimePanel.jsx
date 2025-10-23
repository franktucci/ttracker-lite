import {Container, Paper, Text, Stack, Grid, ThemeIcon, Table, Group, Button, TextInput, ColorPicker, Select, Flex} from '@mantine/core';
import {useState, useEffect} from "react";
import {getTimecodes} from "../../services/timecodesService";
import {getIntervals} from "../../services/intervalsService";
import {insertPunch} from '../../services/punchesService';
import {useForm} from '@mantine/form';

export default function CurrentTimePanel(props) {
  const [time, setTime] = useState(new Date().toLocaleString([], {hour12: true, timeZoneName:"short"}).split(/[ |:]/));
  const [timecodeSelected, setTimecodeSelected] = useState(false);

  const form = useForm({onValuesChange:v => setTimecodeSelected(v.timecodes_id !== null)});

  useEffect(() => {
    setInterval(() => {
      setTime(new Date().toLocaleString([], {hour12: true, timeZoneName:"short"}).split(/[ |:]/));
      props.setMinute(new Date().getMinutes());
    }, 1000);
  }, []);

  function handleSubmitPunch(values, event) {
    const arr = props.intervals.slice();
    const timeCode = event.nativeEvent.submitter.id === "save-btn" ?  Number(values.timecodes_id) : 0;
    const currentTime = new Date();

    insertPunch({timecodes_id: timeCode, note: values.note, user_id: props.loggedInUser.id}).then(result => {
      const IdArr = arr.slice(); 
      IdArr[0].id = result[0].id; 
      props.setIntervals(IdArr);
    });

    if(arr.length > 0) {
      arr[0].endtime = currentTime;
    }
    arr.unshift({timecodes_id: timeCode, note: values.note, user_id: props.loggedInUser.id, starttime: currentTime, endtime: currentTime});

    props.setIntervals(arr);
    console.log(arr);
  }

  function getCurrentTimecode() {
    return props.timecodes.find(x => x.id === props.intervals[0].timecodes_id);
  }

  return (
    <Paper shadow="xl" radius="xl" p="xl">
      <form noValidate onSubmit={form.onSubmit(handleSubmitPunch)}>
        <Group justify="center" grow wrap="nowrap">
          <Stack align="center" w="stretch">
            <div>
              <Group wrap="nowrap" align="end">
                <Group wrap="nowrap" gap="5px" align="end">
                  <Text c={props.intervals && props.intervals[0] && getCurrentTimecode() ? "#" + getCurrentTimecode().hexcolor : "black"} size={50} lh="50px">{time[1]}:{time[2]}</Text>
                  <Text c="grey" size={25} lh="25px">:</Text>
                  <Text w="30px" c="grey" size={25} lh="25px">{time[3]}</Text>
                </Group>
                <Group wrap="nowrap">
                  <Text c={props.intervals && props.intervals[0] && getCurrentTimecode() ? "#" + getCurrentTimecode().hexcolor : "black"} size={50} lh="50px">{time[4].toLowerCase()}</Text>
                </Group>
              </Group>
              <Text>Current Interval Name: {props.intervals && props.intervals[0] && getCurrentTimecode() ? getCurrentTimecode().name : "Downtime"}</Text>
              <Text>Last punch time: {props.intervals && props.intervals[0] && props.intervals[0].starttime ? props.intervals[0].starttime.toLocaleString() : "Unknown"}</Text>
            </div>
          </Stack>
          
            <Stack> 
              <Select
                label="Select Timecode"
                data={props.timecodes.filter(x => x.id).map(x => ({value:x.id.toString(), label:x.name}))}
                key={form.key('timecodes_id')}
                disabled={props.loggedInUser === undefined}
                {...form.getInputProps('timecodes_id')}
              />
              <TextInput label="Note" key={form.key('note')} disabled={props.loggedInUser === undefined} {...form.getInputProps('note')}/>
              <Group>
                {timecodeSelected 
                  ? <Button variant="filled" className="btn" id="save-btn" type="submit">Submit Punch</Button> 
                  : <Button disabled className="btn">Select Timecode to Start Tracking</Button>}
                {props.intervals && props.intervals[0] && props.intervals[0].timecodes_id !== 0 && <Button variant="filled" className="btn" id="cancel-btn" type="submit">Stop Tracking</Button>}
              </Group>
            </Stack>
        </Group>
      </form>
    </Paper>
  );
}
