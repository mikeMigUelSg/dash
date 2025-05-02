// src/components/charts/LineChart.jsx
import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Clock, Maximize2, Download } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import "./Chart.css";

const MyLineChart = ({ temps, title = "Temperature History" }) => {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState("1D");
  const [formattedData, setFormattedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
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
  
  // Effect to filter data when formattedData or timeRange changes
  useEffect(() => {
    filterDataByTimeRange();
  }, [formattedData, timeRange]);
  
  // Filter data based on selected time range
  const filterDataByTimeRange = () => {
    if (!formattedData.length) {
      setFilteredData([]);
      return;
    }
    
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
  };
  
  const handleExportData = () => {
    // Implementation for exporting chart data as CSV
    if (!formattedData.length) return;
    
    const csvContent = [
      "Date,Time,Temperature", 
      ...formattedData.map(item => {
        const date = new Date(item.date);
        return `${date.toLocaleDateString()},${date.toLocaleTimeString()},${item.firstValue}`;
      })
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "temperature_data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
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
            <button className="chart-action-btn" title="Expand chart">
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
          </div>
        </div>
      </div>
      
      <div className="chart-body">
        {filteredData.length === 0 ? (
          <div className="no-data-message">
            <Clock size={24} />
            <p>No data available. Please select a date range and apply filters.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
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
              />
              <Line 
                type="monotone" 
                dataKey="firstValue" 
                name="Temperature"
                stroke="var(--primary)" 
                activeDot={{ r: 6, strokeWidth: 2 }}
                dot={{ r: 2 }}
                strokeWidth={2}
              />
              <Legend formatter={() => "Temperature (°C)"} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default MyLineChart;