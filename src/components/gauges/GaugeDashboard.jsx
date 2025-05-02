// src/components/gauges/GaugeDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { ThermometerSun, CheckCircle, XCircle, AlertTriangle, RefreshCcw } from "lucide-react";
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
  const [loading, setLoading] = useState(false); // Changed to false by default
  const [error, setError] = useState(null);
  const [retries, setRetries] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true); // Track initial load

  // Function to safely get nested value
  const safeGet = (obj, path, defaultValue = 0) => {
    try {
      const keys = path.split('.');
      let result = obj;
      
      for (const key of keys) {
        if (result === null || result === undefined || typeof result !== 'object') {
          return defaultValue;
        }
        result = result[key];
      }
      
      return result !== null && result !== undefined ? result : defaultValue;
    } catch (err) {
      console.error(`Error accessing path ${path}:`, err);
      return defaultValue;
    }
  };

  useEffect(() => {
    const fetchValue = async () => {
      try {
        // Only show loading indicator on initial load
        if (initialLoad) {
          setLoading(true);
        }
        
        let today_date = new Date();
        
        console.log(`Sensor ${sensorId}: Fetching from ${apiEndpoint}`);
        const response = await axios.get(apiEndpoint, { 
          params: { today: today_date },
          // Adding timeout to prevent hanging requests
          timeout: 5000
        });
        
        console.log(`Sensor ${sensorId}: Got response:`, response);
        
        // Safely get values with fallbacks
        const tempValue = safeGet(response, 'data.value.value', 0);
        const dateValue = safeGet(response, 'data.value.date');
        
        setValue(tempValue);
        
        // Check when the last reading was taken, only if we have a valid date
        if (dateValue) {
          const lastDate = new Date(dateValue);
          const currentDate = new Date();
          
          // Calculate time difference in seconds
          const timeDiff = Math.abs(lastDate - currentDate) / 1000;
          
          setState(timeDiff > 10 ? "OFF" : "ON");
        } else {
          setState("OFF");
        }
        
        // Calculate some example min/max/avg values
        // In a real app, these would come from the server
        setMinValue(Math.max(0, tempValue - 5));
        setMaxValue(tempValue + 3);
        setAvgValue((Math.max(0, tempValue - 5) + (tempValue + 3) + tempValue) / 3);
        
        setError(null);
        setRetries(0);
      } catch (error) {
        console.error(`Sensor ${sensorId}: Error fetching gauge data:`, error);
        
        // If we've tried less than 3 times, retry
        if (retries < 3) {
          console.log(`Sensor ${sensorId}: Retry attempt ${retries + 1}`);
          setRetries(prev => prev + 1);
          // No need to set error here as we're retrying
        } else {
          // After 3 retries, show error
          setError(`Could not load Sensor ${sensorId} data. ${error.message || ''}`);
        }
      } finally {
        setLoading(false);
        setInitialLoad(false); // We're no longer in initial load
      }
    };

    fetchValue();
    
    // Set up interval for periodic fetching
    const interval = setInterval(fetchValue, 5000);
    
    return () => clearInterval(interval);
  }, [apiEndpoint, sensorId, retries, initialLoad]);

  const getStateColor = () => {
    return state === "ON" ? "var(--success)" : "var(--danger)";
  };
  
  const getPathColor = () => {
    let intensity = Math.min(1, Math.max(0.2, value / 100));
    
    // Adjust color based on value
    if (value < 20) {
      return `rgba(66, 153, 225, ${intensity})`; // Blue (cool)
    } else if (value < 60) {
      return `rgba(49, 151, 149, ${intensity})`; // Teal (medium)
    } else {
      return `rgba(237, 137, 54, ${intensity})`; // Orange (hot)
    }
  };
  
  const handleRetry = () => {
    setRetries(0);
    setError(null);
    setInitialLoad(true);
  };
  
  // Only show full loading screen on initial load when we don't have data yet
  if (initialLoad && loading) {
    return (
      <div className={`gauge-container ${theme}`}>
        <div className="gauge-loading">
          <div className="loading-spinner"></div>
          <p>Initializing sensor...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`gauge-container ${theme}`}>
        <div className="gauge-error">
          <AlertTriangle size={24} />
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={handleRetry}
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`gauge-container ${theme}`}>
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
          {loading && <div className="mini-spinner"></div>}
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
    </div>
  );
};

export default GaugeDashboard;