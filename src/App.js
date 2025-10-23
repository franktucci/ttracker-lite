import {HashRouter, Route, Routes} from "react-router-dom";
import {MantineProvider} from '@mantine/core';
import HomePage from "./components/HomePage/HomePage";
import "@mantine/core/styles.css";
import "./styles.css";
import { CookiesProvider } from "react-cookie";

export default function App() {
  return (
    <MantineProvider>
      <CookiesProvider>
        <HashRouter basename="/">
          <Routes>
            <Route path="/" element={<HomePage/>}/>
          </Routes>
        </HashRouter>
      </CookiesProvider>
    </MantineProvider>
  )
}
