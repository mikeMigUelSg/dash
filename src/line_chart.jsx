import React, { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Clock, Maximize2, Download, Settings, Sliders, X, Calendar, Search, Filter, Thermometer } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import "./Chart.css";

const MyLineChart = ({ temps, title = "Temperature History", sensorId, setTemps, dateRange, setDateRange }) => {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState("1D");
  const [formattedData, setFormattedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [movingAvgData, setMovingAvgData] = useState([]);
  const [showMovingAvg, setShowMovingAvg] = useState(false);
  const [windowSize, setWindowSize] = useState(5);
  const [isMovingAvgSettingsOpen, setIsMovingAvgSettingsOpen] = useState(false);
  const [isCalculatingMA, setIsCalculatingMA] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filteredAmbientData, setFilteredAmbientData] = useState([]);
  // State for chart filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for ambient temperature
  const [ambientTempData, setAmbientTempData] = useState([]);
  const [showAmbientTemp, setShowAmbientTemp] = useState(true);
  
  // Set default date range (last 7 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    
    // Update parent component date range
    if (setDateRange) {
      setDateRange({
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      });
    }
  }, []);

        // Effect to filter data when formattedData, timeRange, or ambientTempData changes
        useEffect(() => {
            filterDataByTimeRange();
        }, [formattedData, timeRange, ambientTempData]);
        
  // Effect to format data when temps change
  useEffect(() => {
    console.log("Processing temperatures data:", temps);
    
    // Safety check for null or undefined temps
    if (!temps || !Array.isArray(temps) || temps.length === 0) {
      console.log("No valid temperature data received");
      setFormattedData([]);
      return;
    }
    
    try {
      const processed = temps.map(temp => {
        if (!temp || !temp.date) {
          console.warn("Invalid temperature entry:", temp);
          return null;
        }
        
        const timestamp = typeof temp.date === 'number' ? temp.date : new Date(temp.date).getTime();
        
        return {
          ...temp,
          date: timestamp,
          displayTime: new Date(timestamp).toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit"
          })
        };
      }).filter(Boolean); // Remove any null entries
      
      console.log("Processed data:", processed);
      setFormattedData(processed);
    } catch (error) {
      console.error("Error formatting temperature data:", error);
      setFormattedData([]);
    }
  }, [temps]);
  


  // Effect to calculate moving average when filtered data changes
  useEffect(() => {
    if (showMovingAvg) {
      calculateMovingAverage();
    }
  }, [filteredData, windowSize, showMovingAvg]);
  
  // Filter data based on selected time range
  const filterDataByTimeRange = () => {
    if (!formattedData.length) {
      setFilteredData([]);
      return;
    }

      // Effect to filter data when formattedData or timeRange changes
  useEffect(() => {
    filterDataByTimeRange();
  }, [formattedData, timeRange]);
    
    const now = new Date().getTime();
    let cutoff;
    
    switch (timeRange) {
      case "1H":
        cutoff = now - 3600000; // 1 hour in ms
        break;
      case "1D":
        cutoff = now - 86400000; // 24 hours in ms
        break;
      case "1W":
        cutoff = now - 604800000; // 7 days in ms
        break;
      case "1M":
        cutoff = now - 2592000000; // 30 days in ms
        break;
      default:
        cutoff = 0;
    }
    
    const filtered = formattedData.filter(item => item.date >= cutoff);
    console.log(`Filtered data for ${timeRange}:`, filtered);
    setFilteredData(filtered);
    
    // Also filter ambient temperature data based on the same time range
// Also filter ambient temperature data based on the same time range
    if (ambientTempData.length > 0) {
        const filteredAmbient = ambientTempData.filter(item => item.date >= cutoff);
        setFilteredAmbientData(filteredAmbient);
    }
  };

  // Calculate moving average
  const calculateMovingAverage = async () => {
    if (!filteredData.length || filteredData.length < windowSize) {
      setMovingAvgData([]);
      return;
    }

    try {
      setIsCalculatingMA(true);

      // Option 1: Calculate locally (for small datasets)
      if (filteredData.length < 1000) {
        const result = [];

        for (let i = 0; i <= filteredData.length - windowSize; i++) {
          const window = filteredData.slice(i, i + windowSize);
          const sum = window.reduce((acc, item) => acc + item.firstValue, 0);
          const avg = sum / windowSize;
          
          result.push({
            date: filteredData[i + Math.floor(windowSize / 2)].date,
            movingAvg: avg
          });
        }

        setMovingAvgData(result);
      } 
      // Option 2: Use server API for large datasets
      else {
        let startDate, endDate;
        
        if (filteredData.length > 0) {
          const sortedData = [...filteredData].sort((a, b) => a.date - b.date);
          startDate = new Date(sortedData[0].date).toISOString().split('T')[0];
          endDate = new Date(sortedData[sortedData.length - 1].date).toISOString().split('T')[0];
        } else {
          const now = new Date();
          startDate = new Date(now.getTime() - 86400000 * 7).toISOString().split('T')[0]; // 7 days ago
          endDate = now.toISOString().split('T')[0];
        }

        const response = await axios.get("http://localhost:3001/api/movingAverage", {
          params: {
            beg: startDate,
            end: endDate,
            id: sensorId,
            windowSize: windowSize
          }
        });

        setMovingAvgData(response.data.movingAverages.map((avg, index) => ({
          date: filteredData[index + Math.floor(windowSize / 2)].date,
          movingAvg: avg
        })));
      }
    } catch (error) {
      console.error("Error calculating moving average:", error);
    } finally {
      setIsCalculatingMA(false);
    }
  };
  
  const handleExportData = () => {
    // Implementation for exporting chart data as CSV
    if (!formattedData.length) return;
    
    const csvContent = [
      "Date,Time,Temperature,MovingAverage,AmbientTemperature", 
      ...formattedData.map(item => {
        const date = new Date(item.date);
        const maValue = movingAvgData.find(ma => ma.date === item.date)?.movingAvg || "";
        
        // Find closest ambient temperature value by timestamp
        let ambientTemp = "";
        if (ambientTempData.length > 0) {
          // Find the closest ambient temperature by timestamp
          const closest = ambientTempData.reduce((prev, curr) => {
            return (Math.abs(curr.date - item.date) < Math.abs(prev.date - item.date) ? curr : prev);
          });
          ambientTemp = closest ? closest.temperature : "";
        }
        
        return `${date.toLocaleDateString()},${date.toLocaleTimeString()},${item.firstValue},${maValue},${ambientTemp}`;
      })
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `temperature_data_sensor${sensorId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleMovingAvgSettings = () => {
    setIsMovingAvgSettingsOpen(!isMovingAvgSettingsOpen);
  };

  const applyMovingAverage = () => {
    setShowMovingAvg(true);
    calculateMovingAverage();
    setIsMovingAvgSettingsOpen(false);
  };
  
  // Toggle expanded chart view
  const toggleExpandChart = () => {
    setIsExpanded(!isExpanded);
    // Prevent scrolling when chart is expanded
    if (!isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  };
  
  // Handler for fetching data with date filter
  const handleFetchData = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Fetching data with params:", { beg: startDate, end: endDate, id: sensorId });
      const response = await axios.get("http://localhost:3001/api/histTemp1", { 
        params: { beg: startDate, end: endDate } 
      });
      
      console.log("API Response:", response.data);
      
      // Check if we have valid data for the specific sensor
      if (sensorId === 1 && response.data.value && Array.isArray(response.data.value)) {
        console.log("Setting temps1 data:", response.data.value);
        setTemps(response.data.value);
      } else if (sensorId === 2 && response.data.value2 && Array.isArray(response.data.value2)) {
        console.log("Setting temps2 data:", response.data.value2);
        setTemps(response.data.value2);
      } else {
        console.warn(`No valid data for Sensor ${sensorId}`);
        setTemps([]);
      }
      
      // Process ambient temperature data from Porto
      if (response.data.portoHourly && 
          Array.isArray(response.data.portoHourly.time) && 
          Array.isArray(response.data.portoHourly.temperature)) {
        
        // Convert the hourly data to the same format as our temperature data
        const ambientData = response.data.portoHourly.time.map((timeString, index) => {
          const timestamp = new Date(timeString).getTime();
          return {
            date: timestamp,
            temperature: response.data.portoHourly.temperature[index]
          };
        });
        
        console.log("Setting ambient temperature data:", ambientData);
        setAmbientTempData(ambientData);
      } else {
        console.warn("No valid ambient temperature data");
        setAmbientTempData([]);
      }
      
      // Update parent date range if provided
      if (setDateRange) {
        setDateRange({
          startDate,
          endDate
        });
      }
      
      // Hide filter after successful fetch
      setIsFilterVisible(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error fetching data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle escape key to close expanded chart
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isExpanded) {
        toggleExpandChart();
      }
    };

    if (isExpanded) {
      window.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
      // Ensure overflow is restored when component unmounts
      document.body.style.overflow = "auto";
    };
  }, [isExpanded]);
  
  return (
    <>
      <div className={`chart-container ${theme}`}>
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          
          <div className="chart-controls">
            <div className="time-controls">
              <button 
                className={`time-control-btn ${timeRange === "1H" ? "active" : ""}`}
                onClick={() => setTimeRange("1H")}
              >
                1H
              </button>
              <button 
                className={`time-control-btn ${timeRange === "1D" ? "active" : ""}`}
                onClick={() => setTimeRange("1D")}
              >
                1D
              </button>
              <button 
                className={`time-control-btn ${timeRange === "1W" ? "active" : ""}`}
                onClick={() => setTimeRange("1W")}
              >
                1W
              </button>
              <button 
                className={`time-control-btn ${timeRange === "1M" ? "active" : ""}`}
                onClick={() => setTimeRange("1M")}
              >
                1M
              </button>
            </div>
            
            <div className="chart-actions">
              <button 
                className={`chart-action-btn ${isFilterVisible ? "active" : ""}`} 
                title="Filter data"
                onClick={() => setIsFilterVisible(!isFilterVisible)}
              >
                <Filter size={16} />
              </button>
              <button 
                className={`chart-action-btn ${showMovingAvg ? "active" : ""}`} 
                title="Moving Average Settings"
                onClick={toggleMovingAvgSettings}
              >
                <Sliders size={16} />
              </button>
            
                <button 
                className={`chart-action-btn ${showAmbientTemp ? "active" : ""}`} 
                title="Toggle Ambient Temperature"
                onClick={() => setShowAmbientTemp(!showAmbientTemp)}
                >
                <Thermometer size={16} />
                </button>
              <button 
                className="chart-action-btn" 
                title="Expand chart"
                onClick={toggleExpandChart}
              >
                <Maximize2 size={16} />
              </button>
              <button 
                className="chart-action-btn" 
                title="Export data"
                onClick={handleExportData}
                disabled={!formattedData.length}
              >
                <Download size={16} />
              </button>
              {/* Toggle for ambient temperature */}
              <button 
                className={`chart-action-btn ${showAmbientTemp ? "active" : ""}`} 
                title="Toggle Ambient Temperature"
                onClick={() => setShowAmbientTemp(!showAmbientTemp)}
              >
                <Thermometer size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Date Filter Panel */}
        {isFilterVisible && (
          <div className="chart-filter-panel">
            <div className="filter-header">
              <h4>Filter Data</h4>
            </div>
            <div className="filter-body">
              <div className="date-controls">
                <div className="date-field">
                  <Calendar size={16} className="icon" />
                  <div className="date-inputs">
                    <div className="date-input-group">
                      <label className="date-label">From</label>
                      <input 
                        type="date" 
                        className="date-input" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    
                    <div className="date-input-group">
                      <label className="date-label">To</label>
                      <input 
                        type="date" 
                        className="date-input" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <button 
                  className="apply-filter-btn"
                  onClick={handleFetchData}
                  disabled={isLoading || !startDate || !endDate}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      Apply
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Moving Average Settings Panel */}
        {isMovingAvgSettingsOpen && !isExpanded && (
          <div className="moving-avg-settings">
            <div className="settings-header">
              <h4>Moving Average Settings</h4>
            </div>
            <div className="settings-body">
              <div className="settings-row">
                <label htmlFor="windowSize">Window Size:</label>
                <input 
                  type="number" 
                  id="windowSize"
                  min="2"
                  max="20"
                  value={windowSize}
                  onChange={(e) => setWindowSize(Math.max(2, parseInt(e.target.value) || 2))}
                />
              </div>
              <div className="settings-row">
                <label htmlFor="showMovingAvg">Show Moving Average:</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="showMovingAvg"
                    checked={showMovingAvg}
                    onChange={(e) => setShowMovingAvg(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div className="settings-footer">
              <button className="cancel-btn" onClick={() => setIsMovingAvgSettingsOpen(false)}>
                Cancel
              </button>
              <button className="apply-btn" onClick={applyMovingAverage}>
                {isCalculatingMA ? (
                  <>
                    <span className="loading-spinner"></span>
                    Calculating...
                  </>
                ) : (
                  "Apply"
                )}
              </button>
            </div>
          </div>
        )}
        
        <div className="chart-body">
          {filteredData.length === 0 ? (
            <div className="no-data-message">
              <Clock size={24} />
              <p>No data available. Please select a date range and apply filters.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
                />
                <XAxis 
                  dataKey="date"
                  type="number"
                  domain={['auto', 'auto']}
                  tickFormatter={(timestamp) => {
                    const date = new Date(timestamp);
                    return date.toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                  }}
                  stroke={theme === 'dark' ? 'var(--dark-text-secondary)' : 'var(--text-secondary)'}
                  tick={{ fontSize: 12 }}
                  allowDuplicatedCategory={false}
                  data={filteredData}
                />
                <YAxis 
                  stroke={theme === 'dark' ? 'var(--dark-text-secondary)' : 'var(--text-secondary)'}
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? 'var(--dark-card-bg)' : 'white',
                    borderColor: theme === 'dark' ? 'var(--dark-border)' : 'var(--border)',
                    color: theme === 'dark' ? 'var(--dark-text-primary)' : 'var(--text-primary)',
                    borderRadius: '0.375rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  labelFormatter={(timestamp) => {
                    const date = new Date(timestamp);
                    return `Date: ${date.toLocaleString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}`;
                  }}
                  formatter={(value, name) => {
                    // Format based on which line is being displayed
                    if (name === "Temperature") {
                      return [`${value.toFixed(2)}°C`, name];
                    } else if (name === "Ambient Temp") {
                      return [`${value.toFixed(2)}°C`, name];
                    } else if (name.includes("Moving Avg")) {
                      return [`${value.toFixed(2)}°C`, name];
                    }
                    return [value, name];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="firstValue" 
                  data={filteredData}
                  name="Temperature"
                  stroke="var(--primary)" 
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  dot={{ r: 2 }}
                  strokeWidth={2}
                />
                {/* Ambient temperature line */}
                {showAmbientTemp && filteredAmbientData.length > 0 && (
                    <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        data={filteredAmbientData}
                        name="Ambient Temp"
                        stroke="#f59e0b" // Using warning color
                        strokeWidth={2}
                        dot={false}
                        connectNulls={true}
                    />
                    )}
                {showMovingAvg && movingAvgData.length > 0 && (
                  <Line 
                    type="monotone" 
                    dataKey="movingAvg" 
                    data={movingAvgData}
                    name={`Moving Avg (${windowSize})`}
                    stroke="var(--success)" 
                    strokeWidth={2}
                    dot={false}
                    connectNulls={true}
                  />
                )}
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Expanded Chart Modal */}
      {isExpanded && (
        <div className="chart-expanded-modal">
          <div className="chart-expanded-content">
            <div className="expanded-header">
              <h2 className="expanded-title">{title}</h2>
              <button 
                className="close-btn" 
                onClick={toggleExpandChart}
                aria-label="Close expanded chart"
              >
                <X size={20} />
              </button>
            </div>

            <div className="expanded-controls">
              <div className="time-controls">
                <button 
                  className={`time-control-btn ${timeRange === "1H" ? "active" : ""}`}
                  onClick={() => setTimeRange("1H")}
                >
                  1H
                </button>
                <button 
                  className={`time-control-btn ${timeRange === "1D" ? "active" : ""}`}
                  onClick={() => setTimeRange("1D")}
                >
                  1D
                </button>
                <button 
                  className={`time-control-btn ${timeRange === "1W" ? "active" : ""}`}
                  onClick={() => setTimeRange("1W")}
                >
                  1W
                </button>
                <button 
                  className={`time-control-btn ${timeRange === "1M" ? "active" : ""}`}
                  onClick={() => setTimeRange("1M")}
                >
                  1M
                </button>
              </div>
              
              <div className="chart-actions">
                <button 
                  className={`chart-action-btn ${isFilterVisible ? "active" : ""}`} 
                  title="Filter data"
                  onClick={() => setIsFilterVisible(!isFilterVisible)}
                >
                  <Filter size={16} />
                </button>
                <button 
                  className={`chart-action-btn ${showMovingAvg ? "active" : ""}`} 
                  title="Moving Average Settings"
                  onClick={toggleMovingAvgSettings}
                >
                  <Sliders size={16} />
                </button>
                <button 
                  className="chart-action-btn" 
                  title="Export data"
                  onClick={handleExportData}
                  disabled={!formattedData.length}
                >
                  <Download size={16} />
                </button>
                {/* Toggle for ambient temperature in expanded view */}
                <button 
                  className={`chart-action-btn ${showAmbientTemp ? "active" : ""}`} 
                  title="Toggle Ambient Temperature"
                  onClick={() => setShowAmbientTemp(!showAmbientTemp)}
                >
                  <Thermometer size={16} />
                </button>
              </div>
            </div>

            {/* Date Filter Panel in Expanded View */}
            {isFilterVisible && (
              <div className="expanded-filter-panel">
                <div className="filter-header">
                  <h4>Filter Data</h4>
                </div>
                <div className="filter-body">
                  <div className="date-controls">
                    <div className="date-field">
                      <Calendar size={16} className="icon" />
                      <div className="date-inputs">
                        <div className="date-input-group">
                          <label className="date-label">From</label>
                          <input 
                            type="date" 
                            className="date-input" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        
                        <div className="date-input-group">
                          <label className="date-label">To</label>
                          <input 
                            type="date" 
                            className="date-input" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className="apply-filter-btn"
                      onClick={handleFetchData}
                      disabled={isLoading || !startDate || !endDate}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading-spinner"></span>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Search size={14} />
                          Apply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Moving Average Settings Panel in Expanded View */}
            {isMovingAvgSettingsOpen && (
              <div className="moving-avg-settings expanded-settings">
                <div className="settings-header">
                  <h4>Moving Average Settings</h4>
                </div>
                <div className="settings-body">
                  <div className="settings-row">
                    <label htmlFor="expandedWindowSize">Window Size:</label>
                    <input 
                      type="number" 
                      id="expandedWindowSize"
                      min="2"
                      max="20"
                      value={windowSize}
                      onChange={(e) => setWindowSize(Math.max(2, parseInt(e.target.value) || 2))}
                    />
                  </div>
                  <div className="settings-row">
                    <label htmlFor="expandedShowMovingAvg">Show Moving Average:</label>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="expandedShowMovingAvg"
                        checked={showMovingAvg}
                        onChange={(e) => setShowMovingAvg(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                <div className="settings-footer">
                  <button className="cancel-btn" onClick={() => setIsMovingAvgSettingsOpen(false)}>
                    Cancel
                  </button>
                  <button className="apply-btn" onClick={applyMovingAverage}>
                    {isCalculatingMA ? (
                      <>
                        <span className="loading-spinner"></span>
                        Calculating...
                      </>
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              </div>
            )}

            {filteredData.length === 0 ? (
              <div className="no-data-message">
                <Clock size={32} />
                <p>No data available. Please select a date range and apply filters.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={isMovingAvgSettingsOpen || isFilterVisible ? "60%" : "80%"}>
                <LineChart 
                  margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
                  />
                  <XAxis 
                    dataKey="date"
                    type="number"
                    domain={['auto', 'auto']}
                    tickFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      return date.toLocaleString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                    }}
                    stroke={theme === 'dark' ? 'var(--dark-text-secondary)' : 'var(--text-secondary)'}
                    tick={{ fontSize: 14 }}
                    allowDuplicatedCategory={false}
                    data={filteredData}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? 'var(--dark-text-secondary)' : 'var(--text-secondary)'}
                    tick={{ fontSize: 14 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? 'var(--dark-card-bg)' : 'white',
                      borderColor: theme === 'dark' ? 'var(--dark-border)' : 'var(--border)',
                      color: theme === 'dark' ? 'var(--dark-text-primary)' : 'var(--text-primary)',
                      borderRadius: '0.375rem',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    labelFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      return `Date: ${date.toLocaleString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}`;
                    }}
                    formatter={(value, name) => {
                      // Format based on which line is being displayed
                      if (name === "Temperature") {
                        return [`${value.toFixed(2)}°C`, name];
                      } else if (name === "Ambient Temp") {
                        return [`${value.toFixed(2)}°C`, name];
                      } else if (name.includes("Moving Avg")) {
                        return [`${value.toFixed(2)}°C`, name];
                      }
                      return [value, name];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="firstValue" 
                    data={filteredData}
                    name="Temperature"
                    stroke="var(--primary)" 
                    activeDot={{ r: 8, strokeWidth: 2 }}
                    dot={{ r: 3 }}
                    strokeWidth={3}
                  />
                  {/* Ambient temperature line for expanded view */}
                  {showAmbientTemp && ambientTempData.length > 0 && (
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      data={ambientTempData}
                      name="Ambient Temp"
                      stroke="#f59e0b" // Using warning color
                      strokeWidth={3}
                      dot={{ r: 2 }}
                      connectNulls={true}
                    />
                  )}
                  {showMovingAvg && movingAvgData.length > 0 && (
                    <Line 
                      type="monotone" 
                      dataKey="movingAvg" 
                      data={movingAvgData}
                      name={`Moving Avg (${windowSize})`}
                      stroke="var(--success)" 
                      strokeWidth={3}
                      dot={false}
                      connectNulls={true}
                    />
                  )}
                  <Legend />
                  
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MyLineChart; 