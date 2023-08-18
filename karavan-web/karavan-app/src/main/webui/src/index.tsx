import React from 'react';
import ReactDOM from 'react-dom/client';
import "@patternfly/patternfly/patternfly.css";
import './index.css';
import {Main} from "./main/Main";
import {BrowserRouter} from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Main />
        </BrowserRouter>
    </React.StrictMode>
);
