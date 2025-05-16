// App.jsx
import React, { useState } from "react";
import Navbar from "./components/layout/Navbar/Navbar";
import GaugeDashboard1 from "./components/gauges/GaugeDashboard1";
import GaugeDashboard2 from "./components/gauges/GaugeDashboard2";
import LineChart1 from "./components/charts/LineChart1";
import LineChart2 from "./components/charts/LineChart2";
import InputWidget1 from "./components/controls/InputWidget1";
import InputWidget2 from "./components/controls/InputWidget2";
import StatsSection1 from "./components/stats/StatsSection1";
import StatsSection2 from "./components/stats/StatsSection2";
import LiveStatsWidget1 from "./components/stats/LiveStatsWidget1";
import LiveStatsWidget2 from "./components/stats/LiveStatsWidget2";
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
          {/* Sensor 1 Section */}
          <section className="sensor-section">
            <h2 className="section-title">Sensor 1 Dashboard</h2>
            <div className="sensor-content">
              <div className="gauge-widget">
                <GaugeDashboard1 />
                <LiveStatsWidget1 />
              </div>
              <div className="chart-widget">
                <LineChart1 
                  temps={temps1} 
                  sensorId={1}
                  setTemps={setTemps1}
                />
              </div>
              <ThemedControlWidget>
                <InputWidget1 />
              </ThemedControlWidget>
            </div>
            
            {/* Historical Stats Section for Sensor 1 */}
            <StatsSection1 />
          </section>
          
          {/* Sensor 2 Section */}
          <section className="sensor-section">
            <h2 className="section-title">Sensor 2 Dashboard</h2>
            <div className="sensor-content">
              <div className="gauge-widget">
                <GaugeDashboard2 />
                <LiveStatsWidget2 />
              </div>
              <div className="chart-widget">
                <LineChart2 
                  temps={temps2} 
                  sensorId={2}
                  setTemps={setTemps2}
                />
              </div>
              <ThemedControlWidget>
                <InputWidget2 />
              </ThemedControlWidget>
            </div>
            
            {/* Historical Stats Section for Sensor 2 */}
            <StatsSection2 />
          </section>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;