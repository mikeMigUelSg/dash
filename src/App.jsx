import React from "react";
import GaugeDashboard1 from "./Gauge1";
import GaugeDashboard2 from "./Gauge2";
import MyLineChart2 from "./line_chart2";
import MyNavbar from "./nav";
import "./App.css"; 
import FilterBar from "./filter_bar";
import MyLineChart from "./line_chart";
import { useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import LiveCam from "./live_cam";
import InputWidget1 from "./inputFreq1"
import InputWidget2 from "./inputFreq2"
import { StatsContainer } from "./statsTemp1";



const App = () => {
  const [temps, setTemps ] = useState([]);
  const [temps2, setTemps2 ] = useState([]);
  console.log("Values APP : ", temps)
  return (
    <div className="app-container">
      <MyNavbar />
      
      <div className="main-content">
        <FilterBar setTemps={setTemps} setTemps2 = {setTemps2}/>
        <div className="temp1">
          <div className="top-row">
            <div className="left">
              <GaugeDashboard1 />
            </div>
            <div className="right">
              <MyLineChart temps={temps} />
            </div>
          </div>
          <div className="bottom-row">
            <InputWidget1 />
          </div>

        </div>

        <div className="temp2">
          <div className="top-row">
            <div className="left">
              <GaugeDashboard2 />
            </div>
            <div className="right">
              <MyLineChart2 temps2={temps2} />
            </div>
          </div>
          <div className="bottom-row">
            <InputWidget2/>
          </div>
          
        </div>

 
      </div>
    </div>
    
  
  );
};

export default App;
