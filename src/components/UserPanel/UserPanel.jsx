import {Container, Paper, Text, Stack, Grid, ThemeIcon, Table, Group, Button, TextInput, UnstyledButton, Modal, ColorPicker, PasswordInput, Alert} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {useForm} from '@mantine/form';
import {useState, useEffect} from "react";
import {signupNewUser, verifyUser, getUser} from '../../services/usersService';
import {useLocation} from 'react-router-dom'
import { CookiesProvider, useCookies } from 'react-cookie'

export default function TimecodesPanel(props) {
  const [editDialogOpened, editDialogHandlers] = useDisclosure(false);
  const [editModalState, setEditModalState] = useState();
  const [alertNotification, setAlertNotification] = useState(false);
  const [userToken, setUserToken] = useCookies(['user']);

  const loc = useLocation();

  useEffect(() => {
    handleSearchParams();
    if(userToken.user) {
      console.log("hello")
      validateToken(userToken.user);
    }
  }, []);

  async function validateToken(token) {
    const res = await getUser(token);
    console.log(res)
    if(res && res.email !== undefined) {
      props.setLoggedInUser(res);
    }
  }

  async function handleSearchParams() {
    const hash = loc.hash;

    if(hash && hash.length !== 0) {
      const arr = hash.substring(1).split("&");
      if(arr[0].split("=")[0] === "access_token") {
        const res = await getUser(arr[0].split("=")[1]);
        props.setLoggedInUser(res);
      }
    }
  }

  function handleAdd() {
    setEditModalState("signup");
    setAlertNotification(false);
    form.reset();
    editDialogHandlers.open();
  }

  function handleLogin() {
    setEditModalState("login");
    setAlertNotification(false);
    form.reset();
    editDialogHandlers.open();
  }

  function handleAddSubmit(values) {
    signupNewUser(values.username, values.password);
  }

  async function handleLoginSubmit(values) {
    const res = await verifyUser(values.username, values.password);
    if(res === undefined) {
      setAlertNotification(true);
    }
    else {
      props.setLoggedInUser(res.user);
      setUserToken('user', res.access_token, { path: '/' })
      console.log(res);
    }
  }

  function handleValidation(values) {
    const validationText = {};

    if(!values.username) {
      validationText.username = "Username cannot be empty.";
    }
    if(!values.password) {
      validationText.password = "Password cannot be empty.";
    }
    else if(values.password.length < 6) {
      validationText.password = "Password must be longer than 6 characters";
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

  const form = useForm({mode:"uncontrolled", validate: handleValidation});

  return (
    <>
      <Modal radius="xl" size="auto" opened={editDialogOpened} onClose={editDialogHandlers.close} flex centered withCloseButton={false}>
        <Container>
          {editModalState === "signup" && <form onSubmit={form.onSubmit(handleAddSubmit)}>
            <Stack>
              <Text>Sign Up</Text>
              <Text>Once you complete this form, check your email for a Supabase verification.</Text>
              <TextInput label="Email" key={form.key('username')} {...form.getInputProps('username')}/>
              <PasswordInput label="Password" key={form.key('password')} {...form.getInputProps('password')}/>
              <ModalConfirmBtns/>
            </Stack>
          </form>}

          {editModalState === "login" && <form onSubmit={form.onSubmit(handleLoginSubmit)}>
            <Stack>
              <TextInput label="Email" key={form.key('username')} {...form.getInputProps('username')}/>
              <PasswordInput label="Password" key={form.key('password')} {...form.getInputProps('password')}/>
              <ModalConfirmBtns/>
            </Stack>
          </form>}

          {editModalState === "about" && <Stack>
            <Text>
              Time tracker proof of concept app.
            </Text>
            <Text>
              Made with {"<3"} by Frank Tucci.
            </Text>
          </Stack>}
        </Container>
      </Modal>

      {alertNotification && <Alert color="red" withCloseButton onClose={() => setAlertNotification(false)}>
        Username or password not valid.
      </Alert>}
     
      <Group ms="20px" me="20px" justify='space-between'>
        <Text style={{cursor: "pointer"}} c="var(--mantine-color-gray-6)" onClick={() => {setEditModalState("about"); editDialogHandlers.open()}}>About</Text>
        {props.loggedInUser
        ?  <Group justify='end'>
            <Text style={{cursor: "pointer"}} c="var(--mantine-color-red-4)" onClick={() => {setUserToken('user', undefined, { path: '/' }); props.setLoggedInUser()}}>Logout</Text>
            <Text>{props.loggedInUser.email}</Text>
          </Group>
        : <Group justify='end'>
          <Text style={{cursor: "pointer"}} onClick={handleLogin}>Login</Text>
          <Text style={{cursor: "pointer"}} onClick={handleAdd}>Sign Up</Text>
          </Group>
        }
      </Group>
    </>
  );
}