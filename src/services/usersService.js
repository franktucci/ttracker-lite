import {process} from "react";

async function signupNewUser(username, password) {
  return fetch(process.env.REACT_APP_API_URL + "users/signup/", {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({
      email: username,
      password: password,
    }),
  }).then(response => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.json();
  })
  .catch(error => console.error("error", error));
}

async function verifyUser(username, password) {
  console.log(username);
  console.log(password);
  return fetch(process.env.REACT_APP_API_URL + "users/verify/", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      email: username,
      password: password,
    }),
  }).then(response => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.json();
  })
  .catch(error => console.error("error", error));
}

async function getUser(token) {
  return fetch(process.env.REACT_APP_API_URL + "users/", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      token: token
    }),
  }).then(response => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.json();
  })
  .catch(error => console.error("error", error));
}

export {signupNewUser, verifyUser, getUser}
