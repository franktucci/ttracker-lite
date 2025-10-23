import {process} from "react";

async function getIntervals(user_id) {
  return fetch(process.env.REACT_APP_API_URL + "intervals/?user_id=" + user_id)
  .then(response => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.json();
  })
  .catch(error => console.error("error", error));
}

export {getIntervals}
