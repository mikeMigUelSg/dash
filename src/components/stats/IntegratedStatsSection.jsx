// src/components/stats/IntegratedStatsSection.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext.jsx";
import { AlertCircle } from "lucide-react";
import "./IntegratedStatsSection.css";

const IntegratedStatsSection = ({ sensorId, dateRange, temps }) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch stats whenever date range changes
  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate || temps.length === 0) return;
    
    fetchStats();
  }, [dateRange, temps]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("http://localhost:3001/api/tempStats", {
        params: {
          beg: dateRange.startDate,
          end: dateRange.endDate,
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

  // Calculate stats from temps array if API fails or as an alternative
  const calculateLocalStats = () => {
    if (!temps || temps.length === 0) return null;
    
    try {
      const values = temps.map(temp => temp.firstValue).filter(val => !isNaN(val));
      
      if (values.length === 0) return null;
      
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      // Calculate standard deviation
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
      const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
      const std = Math.sqrt(avgSquaredDiff);
      
      return { mean, max, min, std };
    } catch (error) {
      console.error("Error calculating local stats:", error);
      return null;
    }
  };

  // Use API stats or calculate locally if needed
  const displayStats = stats || calculateLocalStats();

  if (loading) {
    return (
      <div className={`integrated-stats-section ${theme}`}>
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`integrated-stats-section ${theme}`}>
        <div className="stats-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!displayStats) {
    return (
      <div className={`integrated-stats-section ${theme}`}>
        <div className="stats-placeholder">
          <p>Select a date range and load data to view statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`integrated-stats-section ${theme}`}>
      <div className="stats-header">
        <h4 className="stats-title">Temperature Statistics</h4>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon mean-icon"></div>
          <div className="stat-content">
            <span className="stat-label">Mean</span>
            <span className="stat-value">
              {displayStats.mean.toFixed(2)} °C
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon max-icon"></div>
          <div className="stat-content">
            <span className="stat-label">Maximum</span>
            <span className="stat-value">
              {displayStats.max.toFixed(2)} °C
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon min-icon"></div>
          <div className="stat-content">
            <span className="stat-label">Minimum</span>
            <span className="stat-value">
              {displayStats.min.toFixed(2)} °C
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon std-icon"></div>
          <div className="stat-content">
            <span className="stat-label">Standard Deviation</span>
            <span className="stat-value">
              {Math.max(0.01, displayStats.std).toFixed(2)} °C
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedStatsSection;