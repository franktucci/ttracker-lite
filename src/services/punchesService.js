import {process} from "react";

async function insertPunch(payload) {
  return fetch(process.env.REACT_APP_API_URL + "punches/",
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

async function editPunch(id, payload) {
  return fetch(process.env.REACT_APP_API_URL + "punches/" + id,
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

async function deletePunch(id, user_id) {
  return fetch(process.env.REACT_APP_API_URL + "punches/" + id + "?user_id=" + user_id,
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

export {insertPunch, editPunch, deletePunch}
