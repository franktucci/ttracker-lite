import {process} from "react";

async function getTimecodes(user_id) {
  return fetch(process.env.REACT_APP_API_URL + "timecodes/?user_id=" + user_id)
  .then(response => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.json();
  })
  .catch(error => console.error("error", error));
}

async function insertTimecode(payload) {
  return fetch(process.env.REACT_APP_API_URL + "timecodes/",
    {
      method: "POST",
      body: JSON.stringify(
          payload
      ),
      headers: {
        "Content-type": "application/json",
      }
    },
  )
  .then(response => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.json();
  })
  .catch(error => console.error(error));
}

async function deleteTimecode(id, user_id) {
  return fetch(process.env.REACT_APP_API_URL + "timecodes/" + id + "?user_id=" + user_id,
    {
      method: "DELETE"
    }
  )
  .then(response => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.json();
  })
  .catch(error => console.error(error));
}

async function editTimecode(id, payload) {
  return fetch(process.env.REACT_APP_API_URL + "timecodes/" + id,
    {
      method: "PATCH",
      body: JSON.stringify(
        payload
      ),
      headers: {
        "Content-type": "application/json",
      }
    }
  )
  .then(response => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.json();
  })
  .catch(error => console.error(error));
}
export {getTimecodes, insertTimecode, deleteTimecode, editTimecode}
