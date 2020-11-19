import React, { Component } from 'react';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles'
import './App.css';
import { blue, indigo } from '@material-ui/core/colors'
import {
  HashRouter,
  Switch,
  Route,
} from "react-router-dom";
import Main from "./components/Main";
import ScrollToTop from './components/ScrollTop'
import Mes from "./components/Mes/Mes";
import CustomExp from "./components/CustomExp/customExp";
import OfflineIntegration from "./components/Offline/offlineIntegration";
import Doc from "./components/Doc/Document";


const theme = createMuiTheme({
  palette: {
    secondary: {
      main: blue[900]
    },
    primary: {
      main: indigo[700]
    }
  },
  typography: {
    // Use the system font instead of the default Roboto font.
    fontFamily: [
      '"Lato"',
      'sans-serif'
    ].join(',')
  }
});


class App extends Component {
  render() {
    return (
      <div>
        <ThemeProvider theme={theme}>

        <HashRouter>
            <ScrollToTop>
            <Switch>
                <Route exact path='/' component={ Main } />
                <Route exact path='/mes' component={ Mes }/>
                <Route exact path='/customExp' component={CustomExp}/>
                <Route exact path='/offlineIntegration' component={OfflineIntegration}/>
                <Route exact path='/doc' component={ Doc }/>


            </Switch>
            </ScrollToTop>
        </HashRouter>

        </ThemeProvider>
      </div>
    );
  }
}

export default App;


