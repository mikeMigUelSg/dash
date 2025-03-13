import React from "react";
import GaugeDashboard from "./Gauge";
import MyNavbar from "./nav";
import "./App.css"; 
import FilterBar from "./filter_bar";
import MyLineChart from "./line_chart";
import { useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import LiveCam from "./live_cam";
import InputWidget from "./inputFreq"


const App = () => {
  const [temps, setTemps ] = useState([]);
  console.log("Values APP : ", temps)
  return (
    <div className="app-container">
      <MyNavbar />
      <div className="main-content">
      <FilterBar setTemps={setTemps}/>
      
      <div className="top-row">
        <div className="left">
          <GaugeDashboard />
        </div>
        <div className="right">
          <MyLineChart temps={temps} />
        </div>
      </div>
      
      <div className="bottom-row">
        <InputWidget />
      </div>
        
      </div>
    </div>
  );
};

export default App;
