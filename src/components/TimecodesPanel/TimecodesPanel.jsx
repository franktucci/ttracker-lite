import {Container, Paper, Text, Stack, Grid, ThemeIcon, Table, Group, Button, TextInput, UnstyledButton, Modal, ColorPicker} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {IconX, IconChevronUp, IconChevronDown, IconEdit} from '@tabler/icons-react';
import {useState, useEffect} from "react";
import {getTimecodes, insertTimecode, deleteTimecode, editTimecode} from "../../services/timecodesService";
import classes from "./TimecodesPanel.css";
import {closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {arrayMove, SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {IconGripVertical} from '@tabler/icons-react';
import {useForm} from '@mantine/form';

export default function TimecodesPanel(props) {
  const [addMode, setAddMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTimecodeInfo, setSelectedTimecodeInfo] = useState();
  const [editDialogOpened, editDialogHandlers] = useDisclosure(false);
  const [editModalState, setEditModalState] = useState();

  // Helper functions for drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
    useSensor(KeyboardSensor)
  );

  function SortableRow({item}) {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({
      id: item.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <Table.Tr w="stretch" ref={setNodeRef} style={style} className={classes.item} {...attributes}>
        <Table.Td w={30} className={classes.dragHandle} {...listeners}>
          <IconGripVertical size={18} stroke={1.5}/>
        </Table.Td>
        <Table.Td w={80}><ThemeIcon color={"#" + item.hexcolor}/></Table.Td>
        <Table.Td w="stretch">{item.name}</Table.Td>
        {editMode && <Table.Td w={30}><UnstyledButton onClick={() => handleEdit(item)}><IconEdit className="icn"/></UnstyledButton></Table.Td>}
        {editMode && <Table.Td w={30}><UnstyledButton onClick={() => handleDelete(item)}><IconX className="icn" id="delete-icn"/></UnstyledButton></Table.Td>}
      </Table.Tr>
    );
  }

  async function handleDragEnd(event) {
    const {active, over} = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = props.timecodes.findIndex((i) => i.id === active.id);
    const newIndex = props.timecodes.findIndex((i) => i.id === over.id);
    const arr = props.timecodes.slice();
    const element = props.timecodes[oldIndex];
    arr.splice(oldIndex, 1);
    arr.splice(newIndex, 0, element);
    props.setTimecodes(arr);

    await editTimecode(active.id, {seq:newIndex, oldseq:oldIndex, user_id: props.loggedInUser.id})
  };

  function handleAdd() {
    form.reset();
    setEditModalState("add");

    let generatedHexcolor = "" ;
    while (generatedHexcolor.length < 6) {
      generatedHexcolor += (Math.round(Math.random() * 15)).toString(16)
    }

    form.getInitialValues().color = "#" + generatedHexcolor;
    editDialogHandlers.open();
  }

  function handleEdit(timecode) {
    form.reset();
    setEditModalState("edit");
    console.log(timecode);
    setSelectedTimecodeInfo(timecode);
    form.getInitialValues().name = timecode.name;
    form.getInitialValues().color = "#" + timecode.hexcolor;
    editDialogHandlers.open();
  }

  function handleDelete(timecode) {
    setEditModalState("delete");
    setSelectedTimecodeInfo(timecode);
    editDialogHandlers.open();
  }

  function handleEditSubmit(values) {
    const arr = props.timecodes.slice();
    const idx = arr.indexOf(selectedTimecodeInfo);

    editTimecode(arr[idx].id, {name: values.name, hexcolor: values.color.substring(1), user_id: props.loggedInUser.id});

    arr[idx].name = values.name;
    arr[idx].hexcolor = values.color.substring(1);

    props.setTimecodes(arr);
  }

  function handleAddSubmit(values) {
    const arr = props.timecodes.slice();
    const seq = arr.length > 0 ? Math.max(...(arr.map(x => x.seq))) + 1 : 0;

    console.log(seq);
    insertTimecode({name: values.name, hexcolor: values.color.substring(1), seq: seq, user_id: props.loggedInUser.id}).then(result => {const IdArr = arr.slice(); IdArr[IdArr.length - 1].id = result[0].id; props.setTimecodes(IdArr)});

    arr.push({name: values.name, hexcolor: values.color.substring(1), seq: seq, user_id: props.loggedInUser.id});

    props.setTimecodes(arr);
  }

  function handleDeleteSubmit() {
    const arr = props.timecodes.slice();
    const idx = arr.indexOf(selectedTimecodeInfo);

    deleteTimecode(arr[idx].id, props.loggedInUser.id);
    arr.splice(idx, 1);

    props.setTimecodes(arr);
  }

  function handleValidation(values) {
    const validationText = {};

    if(editModalState !== "delete" && !values.name) {
      validationText.name = "Name canot be empty."
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

          {editModalState === "add" && <form onSubmit={form.onSubmit(handleAddSubmit)}>
            <Stack>
              <TextInput label="Name" key={form.key('name')} {...form.getInputProps('name')}/>
              <ColorPicker label="Color" key={form.key('color')} {...form.getInputProps('color')}/>
              <ModalConfirmBtns/>
            </Stack>
          </form>}

          {editModalState === "edit" && <form onSubmit={form.onSubmit(handleEditSubmit)}>
            <Stack>
              <TextInput label="Name" key={form.key('name')} {...form.getInputProps('name')}/>
              <ColorPicker label="Color" key={form.key('color')} {...form.getInputProps('color')}/>
              <ModalConfirmBtns/>
            </Stack>
          </form>}

          {editModalState === "delete" && <form onSubmit={form.onSubmit(handleDeleteSubmit)}>
            <Stack>
              <Text>Are you sure you would like to delete this timecode?</Text>
              <ModalConfirmBtns/>
            </Stack>
          </form>}
        </Container>
      </Modal>

      <Paper shadow="xl" radius="xl" p="xl">
        <Group justify="space-between">
          {addMode 
            ? <Button variant="filled" className="btn" id="cancel-btn" onClick={() => {setAddMode(false)}}>Cancel</Button> 
            : <Button variant="filled" className="btn" id="add-btn" onClick={handleAdd}>+</Button>}
          {addMode 
            ? <Button variant="filled" className="btn" id="save-btn" onClick={handleAdd}>Save</Button> 
            : editMode 
              ? <Button variant="filled" className="btn" id="save-btn" onClick={() => setEditMode(false)}>Done</Button> 
              : <Button variant="filled" className="btn" id="edit-btn" onClick={() => {setEditMode(true)}}>Edit</Button>}
        </Group>
        {props.timecodes.length === 0 ? 
        <Text ta="center">Add some timecodes to continue.</Text>
      :
        <Table>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={props.timecodes.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <Table.Tbody>
                {props.timecodes.map((item) => (<SortableRow key={item.id} item={item}/>))}
              </Table.Tbody>
            </SortableContext>
          </DndContext>
        </Table>}
      </Paper>
    </>
  );
}