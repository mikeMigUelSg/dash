// App.jsx
import React, { useState } from "react";
import Navbar from "./components/layout/Navbar/Navbar";
import GaugeDashboard1 from "./components/gauges/GaugeDashboard1";
import GaugeDashboard2 from "./components/gauges/GaugeDashboard2";
import LineChart1 from "./components/charts/LineChart1";
import LineChart2 from "./components/charts/LineChart2";
import InputWidget1 from "./components/controls/InputWidget1";
import InputWidget2 from "./components/controls/InputWidget2";
import LiveStatsWidget1 from "./components/stats/LiveStatsWidget1";
import LiveStatsWidget2 from "./components/stats/LiveStatsWidget2";
import { ThemeProvider, useTheme } from "./components/context/ThemeContext";
import "./App.css";

// Create a new Stats component that receives the same data as the charts
import IntegratedStatsSection from "./components/stats/IntegratedStatsSection";

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
  const [dateRange1, setDateRange1] = useState({ startDate: "", endDate: "" });
  const [dateRange2, setDateRange2] = useState({ startDate: "", endDate: "" });

  return (
    <ThemeProvider>
      <div className="app">
        <Navbar />
        <main className="app-content">
          {/* Sensor 1 Dashboard */}
          <section className="sensor-section">
            <h2 className="section-title">Sensor 1 Dashboard</h2>
            <div className="sensor-content">
              {/* Left section: Gauge and Live Stats */}
              <div className="gauge-widget">
                <GaugeDashboard1 />
                <LiveStatsWidget1 />
              </div>
              
              {/* Middle section: Chart and Stats with shared date range */}
              <div className="chart-stats-widget">
                <LineChart1 
                  temps={temps1} 
                  sensorId={1}
                  setTemps={setTemps1}
                  dateRange={dateRange1}
                  setDateRange={setDateRange1}
                />
                <IntegratedStatsSection 
                  sensorId={1} 
                  dateRange={dateRange1}
                  temps={temps1}
                />
              </div>
              
              {/* Right section: Controls - unchanged */}
              <ThemedControlWidget>
                <InputWidget1 />
              </ThemedControlWidget>
            </div>
          </section>
          
          {/* Sensor 2 Dashboard */}
          <section className="sensor-section">
            <h2 className="section-title">Sensor 2 Dashboard</h2>
            <div className="sensor-content">
              {/* Left section: Gauge and Live Stats */}
              <div className="gauge-widget">
                <GaugeDashboard2 />
                <LiveStatsWidget2 />
              </div>
              
              {/* Middle section: Chart and Stats with shared date range */}
              <div className="chart-stats-widget">
                <LineChart2 
                  temps={temps2} 
                  sensorId={2}
                  setTemps={setTemps2}
                  dateRange={dateRange2}
                  setDateRange={setDateRange2}
                />
                <IntegratedStatsSection 
                  sensorId={2} 
                  dateRange={dateRange2}
                  temps={temps2}
                />
              </div>
              
              {/* Right section: Controls - unchanged */}
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