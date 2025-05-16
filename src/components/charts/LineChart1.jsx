// src/components/charts/LineChart1.jsx
import React from "react";
import MyLineChart from "./LineChart";

const LineChart1 = ({ temps, setTemps }) => {
  return (
    <MyLineChart 
      temps={temps} 
      title="Temperature History - Sensor 1" 
      sensorId={1}
      setTemps={setTemps}
    />
  );
};

export default LineChart1;