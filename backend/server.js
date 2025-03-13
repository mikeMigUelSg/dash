require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Conectar ao mongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", () => console.log("Conectado ao MongoDB"));

//modelo livre 
const GaugeSchema = new mongoose.Schema({}, { strict: false });




// GAUGE ----------------------------
app.get("/api/value", async (req, res) => {
    let today = new Date(req.query.today);
    const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "raw_".concat(today.getDate().toString(), "_", (today.getMonth()+1).toString(), "_", (today.getYear()+1900).toString()));
    console.log("Endpoint /api/value chamado por:", req.headers.referer || "Desconhecido");
     // Log dos valores lidos
    try {
      const lastValue = await GaugeModel.findOne().sort({ _id: -1 });

      res.json({ value: lastValue });
    } catch (error) {
      console.error("Erro ao buscar valor:", error);
      res.status(500).json({ error: "Erro ao buscar valor" });
    }
  });


  // TEMP HISTs ----------------------------
  app.get("/api/histTemp", async (req, res) => {
    console.log("Endpoint /api/value chamado por:", req.headers.referer || "Desconhecido");
    const startDate = new Date(req.query.beg);
    const endDate = new Date(req.query.end);
    
    try {
      const results = [];
    

      // Loop through each day in the range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "raw_".concat(d.getDate().toString(), "_", (d.getMonth()+1).toString(), "_", (d.getYear()+1900).toString()));
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0); // Start of the day
    
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999); // End of the day
    
        const dailyResult = await GaugeModel.aggregate([
          {
            $match: {
              date: { $gte: dayStart, $lte: dayEnd } // Filter by each day's range
            }
          },
          {
            $bucketAuto: {
              groupBy: "$date", // Group by date
              buckets: 100, // Divide into 100 buckets
              output: {
                avgValue: { $avg: "$value" }, // Podera ser utilizado dependendo da config 
                firstValue: { $first: "$value" }, // First value
                date: { $first: "$date" } 
              }
            }
          },
          { $sort: { date: 1 } } 
        ]);
    
        // Append daily results to the final array
        results.push(...dailyResult);
      }
    
      console.log("Dados Agregados:", results);
      res.json({ value: results });
    
    } catch (error) {
      console.error("Erro na agregação:", error);
    }
    
  });

// liveCam ----------------------------
      app.get("/api/liveCam", async (req, res) => {
  
  const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "images");
  console.log("Endpoint /api/liveCam chamado por: (LiveCam)", req.headers.referer || "Desconhecido");
  
  try {
    const lastValue = await GaugeModel.findOne().sort({ _id: -1 });
    const imgData = lastValue.image.data;

    res.json({ value: imgData });

  } catch (error) {
    console.error("Erro ao buscar valor:", error);
    res.status(500).json({ error: "Erro ao buscar valor" });
  }
});

app.get("/api/getFreq", async (req, res) => {
  const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "config");
  console.log("Endpoint /api/getFreq chamado por:", req.headers.referer || "Desconhecido");

  try {
    let obj = await GaugeModel.findOne({ id_: "sampling_config" });

    // Verifica se obj existe
    if (!obj) {
      console.warn("Nenhum documento encontrado para 'sampling_config'");
      return res.status(404).json({ error: "Configuração não encontrada" });
    }

    let c_freq = obj.frequency ?? 0; // Se "frequency" não existir, assume 0 como padrão
    console.log("Freq: ", c_freq);
    res.json({ value: c_freq });

  } catch (error) {
    console.error("Erro ao buscar valor:", error);
    res.status(500).json({ error: "Erro ao buscar valor" });
  }
});


app.post("/api/updateFreq", async (req, res) => {
  const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "config");
  console.log("Endpoint /api/updateFreq chamado por:", req.headers.referer || "Desconhecido");

  const { value } = req.body; // Captura o valor enviado pelo React

  // Validação: verifica se o valor é um número válido
  if (!value || isNaN(value)) {
    return res.status(400).json({ error: "Valor inválido" });
  }

  try {
    // Converte o valor para número
    const newValue = Number(value);

    // Atualiza APENAS o campo "frequency" no documento "sampling_config"
    const updatedConfig = await GaugeModel.findOneAndUpdate(
      { id_: "sampling_config" },  // Filtra pelo ID correto
      { $set: { frequency: newValue } },  // Atualiza SOMENTE o campo "frequency"
      { new: true, upsert: true }  // Retorna o documento atualizado ou cria um novo se não existir
    );

    if (!updatedConfig) {
      return res.status(404).json({ error: "Configuração não encontrada" });
    }

    console.log("Frequência de amostragem atualizada para:", updatedConfig.frequency);
    res.json({ message: "Frequência atualizada com sucesso", newValue: updatedConfig.frequency });

  } catch (error) {
    console.error("Erro ao atualizar frequência:", error);
    res.status(500).json({ error: "Erro ao atualizar frequência" });
  }
});




  

// Iniciar o servidor
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor a estutar http://${HOST}:${PORT}`);
});

