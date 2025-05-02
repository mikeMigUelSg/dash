// App.jsx or your main layout component
import React, { useState } from "react";
import Navbar from "./components/layout/Navbar/Navbar";
import FilterBar from "./components/controls/Filterbar/FilterBar";
import GaugeDashboard1 from "./components/gauges/GaugeDashboard1";
import GaugeDashboard2 from "./components/gauges/GaugeDashboard2";
import LineChart1 from "./components/charts/LineChart1";
import LineChart2 from "./components/charts/LineChart2";
import InputWidget1 from "./components/controls/InputWidget1";
import InputWidget2 from "./components/controls/InputWidget2";
import { ThemeProvider, useTheme } from "./components/context/ThemeContext";
import "./App.css";


const ThemedControlWidget = ({ children }) => {
  const { theme } = useTheme();
  return (
    <div className={`control-widget ${theme}`}>
      {children}
    </div>
  );
};

function App() {
  const [temps1, setTemps1] = useState([]);
  const [temps2, setTemps2] = useState([]);

  return (
    <ThemeProvider>
      <div className="app">
        <Navbar />
        <main className="app-content">
          <FilterBar setTemps={setTemps1} setTemps2={setTemps2} />
          
          {/* Sensor 1 Section */}
          <section className="sensor-section">
            <h2 className="section-title">Sensor 1</h2>
            <div className="sensor-content">
              <div className="gauge-widget">
                <GaugeDashboard1 />
              </div>
              <div className="chart-widget">
                <LineChart1 temps={temps1} />
              </div>
              <ThemedControlWidget>
                <InputWidget1 />
              </ThemedControlWidget>
            </div>
          </section>
          
          {/* Sensor 2 Section */}
          <section className="sensor-section">
            <h2 className="section-title">Sensor 2</h2>
            <div className="sensor-content">
              <div className="gauge-widget">
                <GaugeDashboard2 />
              </div>
              <div className="chart-widget">
                <LineChart2 temps={temps2} />
              </div>
              <ThemedControlWidget>
                <InputWidget2 />
              </ThemedControlWidget>
            </div>
          </section>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;