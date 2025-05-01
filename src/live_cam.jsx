import React, { useState, useEffect } from "react";
import axios from "axios";
import "react-circular-progressbar/dist/styles.css";
import { Container, Row, Col } from "react-bootstrap";
import "./live_cam.css";


const API_URL = "http://localhost:3001/api/liveCam";

const LiveCam = () => {

  const [state, setState] = useState("ON ");
  const [base64Data, setBase64Data] = useState("");
  useEffect(() => {
    const fetchValue = async () => {
      console.time("fetchValue");
      try {
        let today_date = new Date();
        const response = await axios.get(API_URL, { params: { today: today_date } });
        setBase64Data(response.data.value);
        //const lastDate = new Date(response.data.value.date); // Convert string to Date
        console.log("Dadoss: ",response.data.value );
        console.timeEnd("fetchValue");
        
        //console.log("--> Time difference in secnds:", (lastDate - currentDate) / (36e5/3600));
        
     /*   if ((Math.abs( lastDate- currentDate) / (36e5/3600)) > 60) {
          setState("OFF");
        } else {
          setState("ON");
        }*/
      } catch (error) {
        console.error("Erro ao buscar valor:", error);
      }
    };

    fetchValue();
    const interval = setInterval(fetchValue, 10000); // Atualiza a cada 3s

    return () => clearInterval(interval);
  }, []);

  return (
    <Container className="img_container d-flex flex-column align-items-center">
      {/* Título e Indicador de Estado */}
      <div className="title-container">
      <h2 className="img_title">LiveCam</h2>
        <div className="state-indicator" style={{ color: state === "ON" ? "green" : "red" }}>
          <div style={{ backgroundColor: state === "ON" ? "green" : "red" }}></div>
          {state}
        </div>
      </div>

      {/* Gauge de Temperatura */}
      <Row className="row-row w-100 d-flex align-items-center justify-content-center">
        <div className="img-wrapper">
        <div>
            {base64Data ? (
                <img src={`data:image/jpeg;base64,${base64Data}`} alt="Imagem Base64" style={{ width: "420px", height: "auto" }} />
                ) : (
                <p>Carregando imagem...</p>
            )}

         </div>
        </div>
      </Row>
    </Container>
  );
};

export default LiveCam;
