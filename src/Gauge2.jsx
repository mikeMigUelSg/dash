import React, { useState, useEffect } from "react";
import axios from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Container, Row, Col } from "react-bootstrap";
import "./gauge.css";

const API_URL = "http://localhost:3001/api/temp2";

const GaugeDashboard2 = () => {
  const [value, setValue] = useState(0);
  const [state, setState] = useState("OFF");

  useEffect(() => {
    const fetchValue = async () => {
      try {
        let today_date = new Date();
        const response = await axios.get(API_URL, { params: { today: today_date } });
        setValue(response.data.value.value);
        const lastDate = new Date(response.data.value.date); // Convert string to Date
        const currentDate = new Date();
        //console.log("--> latDate :", lastDate );
        //console.log("--> Time difference in milliseconds:", lastDate - currentDate);
        //console.log("--> Time difference in secnds:", (lastDate - currentDate) / (36e5/3600));
 
        if ((Math.abs( lastDate- currentDate) / (36e5/3600)) > 10) {
          setState("OFF");
        } else {
          setState("ON");
        }
      } catch (error) {
        console.error("Erro ao buscar valor:", error);
      }
    };

    fetchValue();
    const interval = setInterval(fetchValue, 500); // Atualiza a cada 3s

    return () => clearInterval(interval);
  }, []);

  return (
    <Container className="gauge_temp_container d-flex flex-column align-items-center">
      {/* Título e Indicador de Estado */}
      <div className="title-container">
      <h2 className="temp_gauge_inst">Current Temperature - DTC 2</h2>
        <div className="state-indicator" style={{ color: state === "ON" ? "green" : "red" }}>
          <div style={{ backgroundColor: state === "ON" ? "green" : "red" }}></div>
          {state}
        </div>
      </div>

      {/* Gauge de Temperatura */}
      <Row className="gauge-row w-100 d-flex align-items-center justify-content-center">
        <div className="gauge-wrapper">
        <CircularProgressbar
          value={value}
          text={`${value}°`}
          circleRatio={1} // Garante 360°
          styles={buildStyles({
            rotation: 1, // Faz o início ser no topo (12h)
            strokeLinecap: 'butt',
            textSize: "15px",
            pathColor: `rgba(62, 152, 199, ${value / 100})`,
            textColor: "#333",
            trailColor: "#ddd",
          })}
        />

        </div>
      </Row>
    </Container>
  );
};

export default GaugeDashboard2;
