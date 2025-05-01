// src/components/gauges/GaugeDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { ThermometerSun, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import "react-circular-progressbar/dist/styles.css";
import "./Gauge.css";

const GaugeDashboard = ({ sensorId, apiEndpoint }) => {
  const { theme } = useTheme();
  const [value, setValue] = useState(0);
  const [state, setState] = useState("OFF");
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
  const [avgValue, setAvgValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchValue = async () => {
      try {
        setLoading(true);
        let today_date = new Date();
        const response = await axios.get(apiEndpoint, { params: { today: today_date } });
        setValue(response.data.value.value);
        
        // Check when the last reading was taken
        const lastDate = new Date(response.data.value.date);
        const currentDate = new Date();
        
        // Calculate time difference in seconds
        const timeDiff = Math.abs(lastDate - currentDate) / 1000;
        
        // Set status based on time difference (10 seconds threshold)
        if (timeDiff > 10) {
          setState("OFF");
        } else {
          setState("ON");
        }
        
        // Set min, max, avg values (would normally be fetched from API)
        // This is placeholder logic
        setMinValue(Math.max(0, value - 5));
        setMaxValue(value + 3);
        setAvgValue((minValue + maxValue + value) / 3);
        
        setError(null);
      } catch (error) {
        console.error("Error fetching gauge data:", error);
        setError("Failed to load sensor data");
      } finally {
        setLoading(false);
      }
    };

    fetchValue();
    const interval = setInterval(fetchValue, 2000);
    
    return () => clearInterval(interval);
  }, [apiEndpoint, minValue, maxValue]);

  const getStateColor = () => {
    return state === "ON" ? "var(--success)" : "var(--danger)";
  };
  
  const getPathColor = () => {
    let intensity = value / 100;
    
    // Adjust color based on value
    if (value < 20) {
      return `rgba(66, 153, 225, ${Math.max(0.3, intensity)})`; // Blue (cool)
    } else if (value < 60) {
      return `rgba(49, 151, 149, ${Math.max(0.4, intensity)})`; // Teal (medium)
    } else {
      return `rgba(237, 137, 54, ${Math.max(0.5, intensity)})`; // Orange (hot)
    }
  };
  
  return (
    <div className={`gauge-container ${theme}`}>
      {loading ? (
        <div className="gauge-loading">
          <div className="loading-spinner"></div>
          <p>Loading sensor data...</p>
        </div>
      ) : error ? (
        <div className="gauge-error">
          <AlertTriangle size={24} />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="gauge-header">
            <div className="gauge-title">
              <ThermometerSun size={18} />
              <h3>Temperature Sensor {sensorId}</h3>
            </div>
            <div className="gauge-status" style={{ color: getStateColor() }}>
              {state === "ON" ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              <span>{state}</span>
            </div>
          </div>
          
          <div className="gauge-body">
            <div className="gauge-wrapper">
              <CircularProgressbar
                value={value}
                text={`${value}°C`}
                circleRatio={1}
                styles={buildStyles({
                  rotation: 1,
                  strokeLinecap: 'round',
                  textSize: '16px',
                  pathColor: getPathColor(),
                  textColor: theme === 'dark' ? 'var(--dark-text-primary)' : 'var(--text-primary)',
                  trailColor: theme === 'dark' ? 'var(--dark-border)' : '#eee',
                  pathTransitionDuration: 0.3,
                })}
              />
            </div>
            
            <div className="gauge-stats">
              <div className="stat-item">
                <span className="stat-label">Min</span>
                <span className="stat-value">{minValue.toFixed(1)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg</span>
                <span className="stat-value">{avgValue.toFixed(1)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max</span>
                <span className="stat-value">{maxValue.toFixed(1)}°C</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GaugeDashboard;