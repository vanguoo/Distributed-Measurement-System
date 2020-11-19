import React, { Component, useState } from "react";
import withStyles from "@material-ui/styles/withStyles";
import { withRouter } from "react-router-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import SimpleLineChart from "../Charts/Demo";
import CPUPercentChart from "../Charts/CPUPercent";
import Topbar from "../Topbar";

// table dependency
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';




const styles = theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.grey["100"],
    overflow: "hidden",
    backgroundSize: "cover",
    backgroundPosition: "0 400px",
    paddingBottom: 200
  },
  grid: {
    width: 1200,
    margin: `0 ${theme.spacing(2)}px`,
    [theme.breakpoints.down("sm")]: {
      width: "calc(100% - 20px)"
    }
  },
  loadingState: {
    opacity: 0.05
  },
  paper: {
    padding: theme.spacing(3),
    margin: theme.spacing(2),
    textAlign: "left",
    color: theme.palette.text.secondary
  },
  rangeLabel: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: theme.spacing(2)
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  outlinedButtom: {
    textTransform: "uppercase",
    margin: theme.spacing(1)
  },
  actionButtom: {
    textTransform: "uppercase",
    margin: theme.spacing(1),
    width: 152,
    height: 36
  },
  blockCenter: {
    padding: theme.spacing(2),
    textAlign: "center"
  },
  block: {
    padding: theme.spacing(2)
  },
  loanAvatar: {
    display: "inline-block",
    verticalAlign: "center",
    width: 16,
    height: 16,
    marginRight: 10,
    marginBottom: -2,
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main
  },
  interestAvatar: {
    display: "inline-block",
    verticalAlign: "center",
    width: 16,
    height: 16,
    marginRight: 10,
    marginBottom: -2,
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.light
  },
  inlining: {
    display: "inline-block",
    marginRight: 10
  },
  buttonBar: {
    display: "flex"
  },
  noBorder: {
    borderBottomStyle: "hidden"
  },
  mainBadge: {
    textAlign: "center",
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4)
  }
});



function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
}));



function SimpleTabs() {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

return (
<div className={classes.root}>
  <AppBar position="static">
    <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
      <Tab label="IV Loop" {...a11yProps(0)} />
      <Tab label="Pulse" {...a11yProps(1)} />
      <Tab label="Only Mode" {...a11yProps(2)} />
      
    </Tabs>
  </AppBar>
  <TabPanel value={value} index={0}>

    {/* <PlotTab/> */}

    <Grid
      container
      direction="row"
      justify="center"
      alignItems="center"
    >   

    <SimpleLineChart/>

    <SimpleLineChart/>

        <Paper >
        <Typography variant="body1">
        Input Box      
        </Typography>

        <Grid item xs={6} >
          <TextField id="standard-basic" label="start" variant="standard" />
        </Grid>

        <Grid item xs={6} >
          <TextField id="standard-basic" label="stop" variant="standard" />
        </Grid>

        <Grid item xs={6}  >
          <TextField id="standard-basic" label="step" variant="standard" />
        </Grid>

        <Grid item xs>
        <Button variant="contained" color="primary">
          Start
        </Button>
        </Grid>

        <Grid item xs>
        <Button variant="contained" color="secondary">
          Stop
        </Button>
        </Grid>

        </Paper>



    </Grid>


  </TabPanel>

  <TabPanel value={value} index={1}>

  <CPUPercentChart/>

  </TabPanel>
  
  
  <TabPanel value={value} index={2}>
    
  <SimpleLineChart/>

  </TabPanel>


</div>
);
}


class Mes extends Component {
  state = {

    amount: 15000,
    period: 3,
    start: 0,
    monthlyInterest: 0,
    totalInterest: 0,
    monthlyPayment: 0,
    totalPayment: 0,
    data: []
  };

  updateValues() {
    const { amount, period, start } = this.state;
    const monthlyInterest =
      (amount * Math.pow(0.01 * 1.01, period)) / Math.pow(0.01, period - 1);
    const totalInterest = monthlyInterest * (period + start);
    const totalPayment = amount + totalInterest;
    const monthlyPayment =
      period > start ? totalPayment / (period - start) : totalPayment / period;

    const data = Array.from({ length: period + start }, (value, i) => {
      const delayed = i < start;
      return {
        Type: delayed ? 0 : Math.ceil(monthlyPayment).toFixed(0),
        OtherType: Math.ceil(monthlyInterest).toFixed(0)
      };
    });

    this.setState({
      monthlyInterest,
      totalInterest,
      totalPayment,
      monthlyPayment,
      data
    });
  }

  componentDidMount() {
    this.updateValues();
  }

  handleChangeAmount = (event, value) => {
    this.setState({ amount: value, loading: false });
    this.updateValues();
  };

  handleChangePeriod = (event, value) => {
    this.setState({ period: value, loading: false });
    this.updateValues();
  };

  handleChangeStart = (event, value) => {
    this.setState({ start: value, loading: false });
    this.updateValues();
  };

  

  render() {
    const { classes } = this.props;

    const currentPath = this.props.location.pathname;

    return (
      <React.Fragment>
        <CssBaseline />
        <Topbar currentPath={currentPath} />
        <div className={classes.root}>

            {/* Dashboard */}
            <Grid container alignItems="left" 
              justify="center"
              
            >

              <Grid item xs={12}>

                <Paper className={classes.paper}> 
                
                  <div className={classes.block}>

                    <Typography variant="h6" color="secondary" gutterBottom>
                      Measurement Dashboard
                    </Typography>

                    <Typography variant="body1">
                      Here is the complete measurement service.
                    </Typography>
                  </div>
                </Paper>

              </Grid>

            </Grid>


            <div>
              <SimpleTabs />
            </div>

         

        </div>

      </React.Fragment>

    );
  }
}

export default withRouter(withStyles(styles)(Mes));