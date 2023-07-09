import React from 'react';
import {createRoot} from "react-dom/client";
import "@patternfly/patternfly/patternfly.css";
import './index.css';
import {Main} from "./Main";

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Main/>);