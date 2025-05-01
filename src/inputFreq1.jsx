import { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from "axios";

const InputWidget1 = () => {
  const [value, setValue] = useState("");
  const [currentFrequency, setCurrentFrequency] = useState(null); 
  const [currentSStatus, setCurrentStatus] = useState(null);
  const [currentMax, setCurrentMax ] = useState(null); 
  const [currentMin, setCurrentMin ] = useState(null); 

  // Função para buscar a frequência atual do backend
  const fetchFrequency = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/getFreq", {params : {id: 1}});

      setCurrentFrequency(response.data.value); 
    } catch (error) {
      console.error("Erro ao buscar a frequência atual:", error);
    }
  };

  const fetchSStatus = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/getStatus", {params : {id: 1}});

      setCurrentStatus(response.data.value);
    } catch (error) {
      console.error("Erro ao buscar o estado atual:", error);
    }
  };

  //Inicializa as configs de acordo com as ultimas salvas no mongoDB
  useEffect(() => {
    fetchFrequency();
    fetchSStatus();
  }, []);      

  // Função para enviar o novo valor de frequência
  const handleSubmit = async () => {
    if (value.trim() === "") return;
    try {
      const response = await axios.post("http://localhost:3001/api/updateFreq", {
        value: value,
        id: 1
      });

      console.log(response.data);
      fetchFrequency(); 
    } catch (error) {
      console.error("Erro ao atualizar frequência:", error);
    }

    setValue("");
  };

  const handleRangeSubmit = async (type_,id_) => {
    let limit; 
    if (type_ == "min"){
      limit = currentMin;
      setCurrentMin("");
    }
    else{
      limit = currentMax; 
      setCurrentMax("");
    }
    console.log("handleRange called");
    try {
      const response = await axios.post("http://localhost:3001/api/updateRange", {
        type: (type_ == "min" ? "Min": "Max"),
        id: id_,
        value: limit,

      });
      console.log(response.data);
      fetchFrequency(); 
    } catch (error) {
      console.error("Erro ao atualizar frequência:", error);
    }
  };




  const handleSwitch = async (value) => {
    try {
      const response = await axios.post("http://localhost:3001/api/updateStatus", {
        value: value,
        id: 1
      });

      console.log(response.data.message);
      fetchSStatus(); 
    } catch (error) {
      console.error("Erro ao atualizar frequência:", error);
    }

  };

  return (
    <div className=" w-100 d-flex bg-white border rounded p-0 justify-content-start align-items-center mt-0 ps-4 gap-4"> {/* Layout flexível com espaçamento */}
      
      {/* Input e Botão */}
      <div className="input-group shadow p-3 bg-white rounded" style={{ width: "350px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Set sampling period (seconds)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn btn-primary" type="button" onClick={handleSubmit}>
          Set
        </button>
      </div>
  
      {/* Frequência Atual */}
      <div className="p-3 border rounded bg-light shadow">
        <h6 className="mb-0 text-muted">Current Period</h6>
        <h5 className="fw-bold text-primary">
          {currentFrequency !== null ? `${currentFrequency} second/sample` : "Loading..."}
        </h5>
      </div>
  
      {/* Switch de Status */}
      <div className="d-flex align-items-center p-3 border rounded bg-light shadow">
        <label className="me-2 mb-0 text-muted" htmlFor="statusSwitch">Status</label>
        <div className="form-check form-switch m-0">
          <input
            className="form-check-input"
            type="checkbox"
            id="statusSwitch"
            checked={currentSStatus}
            onChange={(e) => handleSwitch(e.target.checked)}
          />
        </div>
      </div>
      
      <div className="input-group shadow p-3 bg-white rounded" style={{ width: "170px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Min (ºC)"
          value={currentMin}
          onChange={(e) => setCurrentMin(e.target.value)}
        />
        <button className="btn btn-primary" type="button" onClick={() => handleRangeSubmit("min", 1)}>
          Set
        </button>
      </div>
      <div className="input-group shadow p-3 bg-white rounded" style={{ width: "170px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Max (ºC)"
          value={currentMax}
          onChange={(e) => setCurrentMax(e.target.value)}
        />
        <button className="btn btn-primary" type="button" onClick={() => handleRangeSubmit("Max", 1)}>
          Set 
        </button>
      </div>


    </div>
  );
};

export default InputWidget1;
