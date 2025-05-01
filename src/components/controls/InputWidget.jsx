// src/components/controls/InputWidget.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Clock, ThermometerSun, Power, Settings, Save } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import "./InputWidget.css";

const InputWidget = ({ sensorId }) => {
  const { theme } = useTheme();
  const [samplingPeriod, setSamplingPeriod] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [sensorActive, setSensorActive] = useState(null);
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  useEffect(() => {
    // Fetch current configuration on component mount
    const fetchConfig = async () => {
      try {
        // Fetch sampling period
        const freqResponse = await axios.get("http://localhost:3001/api/getFreq", {
          params: { id: sensorId }
        });
        setCurrentPeriod(freqResponse.data.value);
        
        // Fetch sensor status
        const statusResponse = await axios.get("http://localhost:3001/api/getStatus", {
          params: { id: sensorId }
        });
        setSensorActive(statusResponse.data.value);
        
        // Fetch min/max temperature range would go here
        // ... (omitted for simplicity)
        
      } catch (error) {
        console.error("Error fetching sensor configuration:", error);
        showNotification("Failed to load sensor configuration", "error");
      }
    };
    
    fetchConfig();
  }, [sensorId]);
  
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  const handleSetSamplingPeriod = async () => {
    if (!samplingPeriod.trim() || isNaN(samplingPeriod)) {
      showNotification("Please enter a valid number", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post("http://localhost:3001/api/updateFreq", {
        value: samplingPeriod,
        id: sensorId
      });
      
      setCurrentPeriod(parseFloat(samplingPeriod));
      setSamplingPeriod("");
      showNotification("Sampling period updated successfully");
    } catch (error) {
      console.error("Error updating sampling period:", error);
      showNotification("Failed to update sampling period", "error");
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleSensor = async () => {
    setLoading(true);
    
    try {
      const newStatus = !sensorActive;
      
      const response = await axios.post("http://localhost:3001/api/updateStatus", {
        value: newStatus,
        id: sensorId
      });
      
      setSensorActive(newStatus);
      showNotification(`Sensor ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error("Error updating sensor status:", error);
      showNotification("Failed to update sensor status", "error");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSetTemperatureRange = async (type) => {
    const value = type === 'min' ? minTemp : maxTemp;
    
    if (!value.trim() || isNaN(value)) {
      showNotification(`Please enter a valid ${type === 'min' ? 'minimum' : 'maximum'} temperature`, "error");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post("http://localhost:3001/api/updateRange", {
        type: type === 'min' ? "Min" : "Max",
        id: sensorId,
        value: value
      });
      
      if (type === 'min') {
        setMinTemp("");
      } else {
        setMaxTemp("");
      }
      
      showNotification(`${type === 'min' ? 'Minimum' : 'Maximum'} temperature updated successfully`);
    } catch (error) {
      console.error(`Error updating ${type} temperature:`, error);
      showNotification(`Failed to update ${type === 'min' ? 'minimum' : 'maximum'} temperature`, "error");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={`control-widget ${theme}`}>
      <h3 className="control-title">
        <Settings size={16} />
        Sensor {sensorId} Configuration
      </h3>
      
      <div className="control-grid">
        <div className="control-section sampling-section">
          <div className="section-header">
            <Clock size={16} />
            <h4>Sampling Period</h4>
          </div>
          
          <div className="control-form">
            <div className="input-group">
              <input
                type="text"
                className="control-input"
                placeholder="Set seconds/sample"
                value={samplingPeriod}
                onChange={(e) => setSamplingPeriod(e.target.value)}
                disabled={loading}
              />
              <button
                className="control-button"
                onClick={handleSetSamplingPeriod}
                disabled={loading}
              >
                <Save size={14} />
                Set
              </button>
            </div>
            
            <div className="info-display">
              <span className="info-label">Current Period</span>
              <span className="info-value">
                {currentPeriod !== null ? `${currentPeriod} sec/sample` : "Loading..."}
              </span>
            </div>
          </div>
        </div>
        
        <div className="control-section status-section">
          <div className="section-header">
            <Power size={16} />
            <h4>Sensor Status</h4>
          </div>
          
          <div className="status-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!!sensorActive}
                onChange={handleToggleSensor}
                disabled={loading || sensorActive === null}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">
              {sensorActive === null ? "Loading..." : (sensorActive ? "Active" : "Inactive")}
            </span>
          </div>
        </div>
        
        <div className="control-section range-section">
          <div className="section-header">
            <ThermometerSun size={16} />
            <h4>Temperature Range</h4>
          </div>
          
          <div className="range-controls">
            <div className="range-input">
              <label className="range-label">Min (°C)</label>
              <div className="input-group">
                <input
                  type="text"
                  className="control-input"
                  placeholder="Min value"
                  value={minTemp}
                  onChange={(e) => setMinTemp(e.target.value)}
                  disabled={loading}
                />
                <button
                  className="control-button"
                  onClick={() => handleSetTemperatureRange('min')}
                  disabled={loading}
                >
                  Set
                </button>
              </div>
            </div>
            
            <div className="range-input">
              <label className="range-label">Max (°C)</label>
              <div className="input-group">
                <input
                  type="text"
                  className="control-input"
                  placeholder="Max value"
                  value={maxTemp}
                  onChange={(e) => setMaxTemp(e.target.value)}
                  disabled={loading}
                />
                <button
                  className="control-button"
                  onClick={() => handleSetTemperatureRange('max')}
                  disabled={loading}
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default InputWidget;