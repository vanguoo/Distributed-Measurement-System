import io from 'socket.io-client';
import React from 'react';
import { useEffect, useState } from 'react';
import {
    Line,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid, Tooltip, Legend,
  } from 'recharts';


const socket = io('http://127.0.0.1:39002', {
  transports: ['websocket', 'polling']
});


function Plot() {

    const [data, setData] = useState([]);

    // 1. listen for a cpu event and update the state
    useEffect(() => {
      socket.on('cpu', cpuPercent => {
        setData(currentData => [...currentData, cpuPercent]);
      });
    }, []);

    return (
        <div>
        <h1>Real Time CPU Usage</h1>

        <LineChart
    width={500}
    height={400}
    data={data}
    margin={{
      top: 5, right: 30, left: 20, bottom: 5,
    }}
  >

    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />

  </LineChart>
  

      </div>
    );
}

export default class Example extends React.Component {

    render() {
      return (
        <Plot/>
      );
    }
  }
