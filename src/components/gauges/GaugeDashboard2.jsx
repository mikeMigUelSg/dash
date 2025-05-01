// src/components/gauges/GaugeDashboard2.jsx
import React from "react";
import GaugeDashboard from "./GaugeDashboard";

const GaugeDashboard2 = () => {
  return <GaugeDashboard 
    sensorId={2} 
    apiEndpoint="http://localhost:3001/api/temp2" 
  />;
};

export default GaugeDashboard2;