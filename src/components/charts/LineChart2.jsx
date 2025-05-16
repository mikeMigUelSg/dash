// src/components/charts/LineChart2.jsx
import React from "react";
import MyLineChart from "./LineChart";

const LineChart2 = ({ temps, setTemps }) => {
  return (
    <MyLineChart 
      temps={temps} 
      title="Temperature History - Sensor 2" 
      sensorId={2}
      setTemps={setTemps}
    />
  );
};

export default LineChart2;