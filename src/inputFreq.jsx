import { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from "axios";

const InputWidget = () => {
  const [value, setValue] = useState("");
  const [currentFrequency, setCurrentFrequency] = useState(null); // Estado para armazenar a frequência atual

  // Função para buscar a frequência atual do backend
  const fetchFrequency = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/getFreq");
      setCurrentFrequency(response.data.value); // Atualiza o estado
    } catch (error) {
      console.error("Erro ao buscar a frequência atual:", error);
    }
  };

  // Atualiza a frequência a cada 2 segundos
  useEffect(() => {
    fetchFrequency();
    const interval = setInterval(fetchFrequency, 2000); 
    return () => clearInterval(interval);
  }, []);

  // Função para enviar o novo valor de frequência
  const handleSubmit = async () => {
    if (value.trim() === "") return;

    try {
      const response = await axios.post("http://localhost:3001/api/updateFreq", {
        value: Number(value),
      });

      console.log(response.data.message);
      fetchFrequency(); 
    } catch (error) {
      console.error("Erro ao atualizar frequência:", error);
    }

    setValue("");
  };

  return (
    <div className="container d-flex justify-content-start align-items-center mt-4"> {/* Layout flexível */}
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

      {/* Frequência Atual - Alinhado à Direita */}
      <div className="ms-3 p-3 border rounded bg-light shadow">
        <h6 className="mb-0 text-muted">Current Period</h6>
        <h4 className="fw-bold text-primary">{currentFrequency !== null ? `${currentFrequency} seconds` : "Loading..."}</h4>
      </div>
    </div>
  );
};

export default InputWidget;
