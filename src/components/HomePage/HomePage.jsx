import {Container, Paper, Text, Stack, Grid, ThemeIcon, Table, Group, Button, TextInput, ColorPicker, Alert, Card} from '@mantine/core';
import {useState, useEffect} from "react";
import CurrentTimePanel from "../CurrentTimePanel/CurrentTimePanel";
import TimecodesPanel from "../TimecodesPanel/TimecodesPanel";
import IntervalsPanel from "../IntervalsPanel/IntervalsPanel";
import UserPanel from "../UserPanel/UserPanel";
import {getTimecodes, insertTimecode, deleteTimecode} from "../../services/timecodesService";
import {getIntervals} from "../../services/intervalsService";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [timecodes, setTimecodes] = useState([]);
  const [intervals, setIntervals] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState();
  const [minute, setMinute] = useState(new Date().getMinutes());

  async function loadTimecodes() {
    const result = await getTimecodes(loggedInUser.id);
    if(result === undefined) {
      setConnectionError(true);
      return;
    }
    console.log(result)
    setTimecodes(result);
  }

  async function loadIntervals() {
    const result = await getIntervals(loggedInUser.id);
    if(result === undefined) {
      setConnectionError(true);
      return;
    }
    result.map(x => {
      x.starttime = new Date(x.starttime);
      x.endtime = new Date(x.endtime);
    })
    console.log(result);
    setIntervals(result);
  }

  async function loadData() {
    await loadTimecodes();
    await loadIntervals();
    setLoading(false);
  }

  useEffect(() => {
    if(loggedInUser) {
      loadData();
    }
    else {
      setTimecodes([]);
      setIntervals([]);
    }
  }, [loggedInUser]);
  
  return (
    <Container fluid m={50}>
      {loggedInUser && loading 
        ? <Alert color="blue">Loading...</Alert>
        : connectionError
        ? <Alert color="red">Error Connecting to DB. Try again shortly.</Alert>
        : <Stack align="stretch" justify="center" gap="xl">
        <UserPanel loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser}/>
        <CurrentTimePanel timecodes={timecodes} intervals={intervals} setIntervals={setIntervals} loggedInUser={loggedInUser} setMinute={setMinute}/>
        {loggedInUser &&
        <Grid gutter="xl">
          <Grid.Col span={4}>
            <TimecodesPanel timecodes={timecodes} setTimecodes={setTimecodes} loggedInUser={loggedInUser}/>
          </Grid.Col>
          <Grid.Col span={8}>
            <IntervalsPanel timecodes={timecodes} intervals={intervals} setIntervals={setIntervals} loggedInUser={loggedInUser} minute={minute}/>
          </Grid.Col>
        </Grid>}
      </Stack>}
    </Container>
  );
};