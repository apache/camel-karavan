import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import "@patternfly/patternfly/patternfly.css";
import './index.css';
import {Main} from "./Main";

const routes = [
    { path: '/', component: Main},
];

ReactDOM.render(
  <Router forceRefresh={true}>
    <Switch>
      {routes.map((route) => (
        <Route key={route.path} exact path={route.path} render={() => <route.component />} />
      ))}
    </Switch>
  </Router>,
  document.getElementById('root')
);