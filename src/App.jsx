// src/App.jsx
import React, { useState } from "react";
import GaugeDashboard1 from "./components/gauges/GaugeDashboard1";
import GaugeDashboard2 from "./components/gauges/GaugeDashboard2";
import LineChart1 from "./components/charts/LineChart1";
import LineChart2 from "./components/charts/LineChart2";
import Navbar from "./components/layout/Navbar/Navbar";
import FilterBar from "./components/controls/FilterBar/FilterBar";
import InputWidget1 from "./components/controls/InputWidget1";
import InputWidget2 from "./components/controls/InputWidget2";
import { ThemeProvider } from "./components/context/ThemeContext.jsx";
import "./App.css";

const App = () => {
  const [temps, setTemps] = useState([]);
  const [temps2, setTemps2] = useState([]);

  return (
    <ThemeProvider>
      <div className="app-container">
        <Navbar />
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">RevPI Temperature Monitoring</h1>
            <FilterBar setTemps={setTemps} setTemps2={setTemps2} />
          </div>
          
          <div className="dashboard-grid">
            <div className="dashboard-card sensor-section">
              <div className="card-header">
                <h2>Temperature Sensor 1</h2>
                <span className="card-subtitle">Primary measurement unit</span>
              </div>
              <div className="card-body">
                <div className="sensor-data-row">
                  <div className="gauge-container">
                    <GaugeDashboard1 />
                  </div>
                  <div className="chart-container">
                    <LineChart1 temps={temps} />
                  </div>
                </div>
                <div className="controls-container">
                  <InputWidget1 />
                </div>
              </div>
            </div>
            
            <div className="dashboard-card sensor-section">
              <div className="card-header">
                <h2>Temperature Sensor 2</h2>
                <span className="card-subtitle">Secondary measurement unit</span>
              </div>
              <div className="card-body">
                <div className="sensor-data-row">
                  <div className="gauge-container">
                    <GaugeDashboard2 />
                  </div>
                  <div className="chart-container">
                    <LineChart2 temps2={temps2} />
                  </div>
                </div>
                <div className="controls-container">
                  <InputWidget2 />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;