// src/components/stats/StatsSection.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext.jsx";
import { AlertCircle, FileSpreadsheet, RefreshCw } from "lucide-react";
import "./StatsSection.css";

const StatsSection = ({ sensorId }) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Set default date range to last 7 days
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  const fetchStats = async () => {
    if (!startDate || !endDate) {
      setError("Please select a date range");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("http://localhost:3001/api/tempStats", {
        params: {
          beg: startDate,
          end: endDate,
          id: sensorId
        }
      });

      setStats(response.data);
    } catch (error) {
      console.error(`Error fetching statistics for sensor ${sensorId}:`, error);
      setError(error.response?.data?.error || "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when component mounts with default date range
  useEffect(() => {
    if (startDate && endDate) {
      fetchStats();
    }
  }, [sensorId, startDate, endDate]);

  const handleRefresh = () => {
    fetchStats();
  };

  return (
    <div className={`stats-section ${theme}`}>
      <div className="stats-header">
        <h3 className="stats-title">
          <FileSpreadsheet size={16} />
          Temperature Statistics
        </h3>
        
        <div className="stats-controls">
          <div className="date-controls">
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
            
            <button 
              className="refresh-button" 
              onClick={handleRefresh}
              disabled={loading || !startDate || !endDate}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <RefreshCw size={14} />
              )}
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {error ? (
        <div className="stats-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon mean-icon"></div>
            <div className="stat-content">
              <span className="stat-label">Mean</span>
              <span className="stat-value">
                {stats ? stats.mean.toFixed(2) : '-'} °C
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon max-icon"></div>
            <div className="stat-content">
              <span className="stat-label">Maximum</span>
              <span className="stat-value">
                {stats ? stats.max.toFixed(2) : '-'} °C
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon min-icon"></div>
            <div className="stat-content">
              <span className="stat-label">Minimum</span>
              <span className="stat-value">
                {stats ? stats.min.toFixed(2) : '-'} °C
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon std-icon"></div>
            <div className="stat-content">
              <span className="stat-label">Standard Deviation</span>
              <span className="stat-value">
                {stats ? stats.std.toFixed(2) : '-'} °C
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsSection;