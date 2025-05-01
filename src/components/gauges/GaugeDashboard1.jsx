// src/components/gauges/GaugeDashboard1.jsx
import React from "react";
import GaugeDashboard from "./GaugeDashboard";

const GaugeDashboard1 = () => {
  return <GaugeDashboard 
    sensorId={1} 
    apiEndpoint="http://localhost:3001/api/temp1" 
  />;
};

export default GaugeDashboard1;

