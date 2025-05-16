// src/components/stats/LiveStatsWidget.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext.jsx";
import { Activity, Clock, Thermometer, RefreshCw } from "lucide-react";
import "./LiveStatsWidget.css";

const LiveStatsWidget = ({ sensorId }) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const fetchRealTimeStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Set up today's date
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Format dates
      const startDate = yesterday.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // Fetch data
      const response = await axios.get("http://localhost:3001/api/tempStats", {
        params: {
          beg: startDate,
          end: endDate,
          id: sensorId
        }
      });
      
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(`Error fetching live statistics for sensor ${sensorId}:`, error);
      setError("Unable to fetch current statistics");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch stats on component mount and every 30 seconds
  useEffect(() => {
    fetchRealTimeStats();
    
    const interval = setInterval(() => {
      fetchRealTimeStats();
    }, 30000); // 30 seconds refresh
    
    return () => clearInterval(interval);
  }, [sensorId]);
  
  // Format the time since last update
  const getUpdateTimeDisplay = () => {
    if (!lastUpdated) return "Never";
    
    const now = new Date();
    const diffMs = now - lastUpdated;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    } else {
      return lastUpdated.toLocaleTimeString();
    }
  };
  
  const handleRefresh = () => {
    fetchRealTimeStats();
  };
  
  return (
    <div className={`live-stats-widget ${theme}`}>
      <div className="live-stats-header">
        <h3 className="live-stats-title">
          <Activity size={18} />
          Real-time Analysis
        </h3>
        
        <div className="refresh-container">
          <span className="update-time">
            <Clock size={14} />
            {getUpdateTimeDisplay()}
          </span>
          
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh data"
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>
      </div>
      
      {error ? (
        <div className="live-stats-error">
          <span>{error}</span>
        </div>
      ) : (
        <div className="live-stats-content">
          <div className="current-temp">
            <Thermometer size={24} />
            <div>
              <span className="stat-label">Current</span>
              <span className="current-temp-value">
                {stats ? `${stats.mean.toFixed(1)}°C` : '-'}
              </span>
            </div>
          </div>
          
          <div className="stat-values">
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-label">24h High</span>
                <span className="stat-value high">
                  {stats ? `${stats.max.toFixed(1)}°C` : '-'}
                </span>
              </div>
              
              <div className="stat-item">
                <span className="stat-label">24h Low</span>
                <span className="stat-value low">
                  {stats ? `${stats.min.toFixed(1)}°C` : '-'}
                </span>
              </div>
            </div>
            
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-label">Volatility</span>
                <span className="stat-value">
                  {stats ? `±${stats.std.toFixed(2)}°C` : '-'}
                </span>
              </div>
              
              <div className="stat-item">
                <span className="stat-label">Samples</span>
                <span className="stat-value">
                  24h
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStatsWidget;