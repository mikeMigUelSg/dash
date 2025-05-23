import "./filter_bar.css";
import axios from "axios";
import React, { useState } from "react";

const FilterBar = ({setTemps , setTemps2}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  const API_URL = "http://localhost:3001/api/histTemp1";
  console.log("FilterBar component rendered");

  const handleApply = async () => {
    
    try {     
      console.log("Start_date client: ", startDate)
      const response = await axios.get(API_URL, { params: { beg: startDate, end: endDate } });
      setTemps(response.data.value);
      setTemps2(response.data.value2);
    } catch (error) {
      console.error("Erro ao buscar valor:", error);
    } 
      
  };

  return (
    <div className="filter-bar">
      {/* Status Picker */}
      <div className="filter-item">
        <label>Status:</label>
        <select>
          <option>All</option>
          <option>On</option>
          <option>Off</option>
        </select>
      </div>

      {/* Variable Picker */}
      <div className="filter-item">
        <label>Variable:</label>
        <select>
          <option>Temperature</option>
          <option>Temperature 2</option>
        </select>
      </div>

      {/* Date Range Picker */}
      <div className="date-range">
        <label>Begning:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>End:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <button type="button" className="apply-button" onClick={handleApply}>
        Apply
      </button>
    </div>
  );
};

export default FilterBar;
