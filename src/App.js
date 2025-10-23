import {BrowserRouter, Route, Routes} from "react-router-dom";
import {MantineProvider} from '@mantine/core';
import HomePage from "./components/HomePage/HomePage";
import "@mantine/core/styles.css";
import "./styles.css";
import { CookiesProvider } from "react-cookie";

export default function App() {
  return (
    <MantineProvider>
      <CookiesProvider>
        <BrowserRouter basename="/">
          <Routes>
            <Route path="/" element={<HomePage/>}/>
          </Routes>
        </BrowserRouter>
      </CookiesProvider>
    </MantineProvider>
  )
}
