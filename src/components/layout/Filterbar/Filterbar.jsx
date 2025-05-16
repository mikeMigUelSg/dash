// src/components/controls/FilterBar.jsx
import React, { useState } from 'react';
import { Calendar, Filter, Share2, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import './FilterBar.css';

const FilterBar = ({ setTemps, setTemps2 }) => {
  const { theme } = useTheme();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("All");
  const [variable, setVariable] = useState("Temperature");
  const [isLoading, setIsLoading] = useState(false);
  
  const API_URL = "http://localhost:3001/api/histTemp1";
  
  const handleApply = async () => {
    if (!startDate || !endDate) {
      // Show error notification
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.get(API_URL, { 
        params: { beg: startDate, end: endDate } 
      });
      
      setTemps(response.data.value);
      setTemps2(response.data.value2);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Show error notification
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`filter-bar ${theme}`}>
      <div className="filter-section">
        <h3 className="filter-title">
          <Filter size={16} />
          Data Filters
        </h3>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>
              <span className="filter-label">Status</span>
              <select 
                className="filter-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="All">All</option>
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </label>
          </div>
          
          <div className="filter-group">
            <label>
              <span className="filter-label">Variable</span>
              <select 
                className="filter-select"
                value={variable}
                onChange={(e) => setVariable(e.target.value)}
              >
                <option value="Temperature">Temperature</option>
                <option value="Temperature 2">Temperature 2</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      
      <div className="date-section">
        <h3 className="filter-title">
          <Calendar size={16} />
          Date Range
        </h3>
        
        <div className="date-controls">
          <div className="date-group">
            <label>
              <span className="filter-label">From</span>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  className="date-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </label>
          </div>
          
          <div className="date-group">
            <label>
              <span className="filter-label">To</span>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  className="date-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </label>
          </div>
          
          <button 
            className={`apply-button ${isLoading ? 'loading' : ''}`}
            onClick={handleApply}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Loading...
              </>
            ) : (
              <>
                <Search size={16} />
                Apply Filters
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="actions-section">
        <button className="export-button">
          <Share2 size={16} />
          Export Data
        </button>
      </div>
    </div>
  );
};

export default FilterBar;