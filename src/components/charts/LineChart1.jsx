// src/components/charts/LineChart1.jsx
import React from "react";
import MyLineChart from "./LineChart";

const LineChart1 = ({ temps }) => {
  return (
    <MyLineChart 
      temps={temps} 
      title="Temperature History - Sensor 1" 
    />
  );
};

export default LineChart1;