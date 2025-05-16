

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


app.get('/api/tempStats', async (req, res) => {
  const startDate = new Date(req.query.beg);
  const endDate = new Date(req.query.end);
  const sensorId = req.query.id;
  console.log(" Start Date:", startDate);
  console.log(" End Date:", endDate);

  const values = [];

  try {
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      
      const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "raw_".concat(d.getDate(), "_", (d.getMonth() + 1), "_", (d.getFullYear())));
      const dailyValues = await GaugeModel.find({
        date: { $gte: dayStart.getTime(), $lte: dayEnd.getTime() },
        id: sensorId,
        value: { $lt: 100 }
      }).select('value -_id');

      dailyValues.forEach(doc => values.push(doc.value));
    }

    if (values.length === 0) {
      return res.status(404).json({ error: "No data found for the given interval." });
    }
    console.log("Values fetched:", values);
    // Calculations
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);

    console.log("Statistics calculated:", { mean, max, min, std });

    res.json({ mean, max, min, std });

  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// This code should be added to backend/server.js

app.get('/api/movingAverage', async (req, res) => {
  const startDate = new Date(req.query.beg);
  const endDate = new Date(req.query.end);
  const sensorId = req.query.id;
  const windowSize = parseInt(req.query.windowSize) || 5; // default window size

  const values = [];

  try {
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "raw_".concat(d.getDate(), "_", (d.getMonth() + 1), "_", (d.getFullYear())));
      const dailyValues = await GaugeModel.find({
        date: { $gte: d.setHours(0,0,0,0), $lte: d.setHours(23,59,59,999) },
        id: sensorId,
        value: { $lt: 100 }
      }).select('value -_id');

      dailyValues.forEach(doc => values.push(doc.value));
    }

    if (values.length < windowSize) {
      return res.status(400).json({ error: "Insufficient data points for the moving average calculation." });
    }

    const movingAverages = [];
    for (let i = 0; i <= values.length - windowSize; i++) {
      const window = values.slice(i, i + windowSize);
      const avg = window.reduce((a, b) => a + b, 0) / windowSize;
      movingAverages.push(avg);
    }

    res.json({ movingAverages });

  } catch (error) {
    console.error("Error calculating moving averages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// GAUGE ----------------------------
app.get("/api/temp1", async (req, res) => {
    let today = new Date(req.query.today);
    const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "raw_".concat(today.getDate().toString(), "_", (today.getMonth()+1).toString(), "_", (today.getYear()+1900).toString()));
    console.log("Endpoint /api/temp1 chamado por:", req.headers.referer || "Desconhecido");
     // Log dos valores lidos
    try {
      const lastValue = await GaugeModel.findOne({"id": "1"}).sort({ _id: -1 });
      res.json({ value: lastValue });
    } catch (error) {
      console.error("Erro ao buscar valor:", error);
      res.status(500).json({ error: "Erro ao buscar valor" });
    }
  });

// GAUGE ----------------------------
app.get("/api/temp2", async (req, res) => {
  let today = new Date(req.query.today);
  const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "raw_".concat(today.getDate().toString(), "_", (today.getMonth()+1).toString(), "_", (today.getYear()+1900).toString()));
  console.log("Endpoint /api/temp2 chamado por:", req.headers.referer || "Desconhecido");
   // Log dos valores lidos
  try {
    const lastValue = await GaugeModel.findOne({"id": "2"}).sort({ _id: -1 });
    res.json({ value: lastValue });
  } catch (error) {
    console.error("Erro ao buscar valor:", error);
    res.status(500).json({ error: "Erro ao buscar valor" });
  }
});


  // TEMP HISTs ----------------------------
  app.get("/api/histTemp1", async (req, res) => {
    console.log("---Endpoint /api/value chamado por:", req.headers.referer || "Desconhecido");
    const startDate = new Date(req.query.beg);
    const endDate = new Date(req.query.end);
    
    try {
      const results = [];
      const results2 = []

      console.log(startDate);
      console.log(endDate);

      // Loop through each day in the range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "raw_".concat(d.getDate().toString(), "_", (d.getMonth()+1).toString(), "_", (d.getYear()+1900).toString()));
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0); // Start of the day
        
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999); // End of the day
        console.log(d)
        const dailyResult = await GaugeModel.aggregate([
          {
            $match: {
              date: { 
                $gte: dayStart.getTime(),
                $lte: dayEnd.getTime()
              },
              id: "1",             
              value: { $lt: 100 }   
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

        const dailyResult2 = await GaugeModel.aggregate([
          {
            $match: {
              date: { 
                $gte: dayStart.getTime(),
                $lte: dayEnd.getTime()
              },
              id: "2",             
              value: { $lt: 100 }   
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
    
        results2.push(...dailyResult2);
      }
     
      res.json({ value: results , value2: results2});
    
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
  const id = req.query.id; 
  
  const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "config");
  console.log("Endpoint /api/getFreq chamado por:", req.headers.referer || "Desconhecido");
  
  try {
    let obj = await GaugeModel.findOne({ id_: "config" });
    
    // Verifica se obj existe
    if (!obj) {
      console.warn("Nenhum documento encontrado para 'sampling_config'");
      return res.status(404).json({ error: "Configuração não encontrada" });
    }
    const c_freq = obj.frequency[`temp${id}`];


    res.json({ value: c_freq });
    
  } catch (error) {
    console.error("Erro ao buscar valor:", error);
    res.status(500).json({ error: "Erro ao buscar valor" });
  }
});


app.get("/api/getStatus", async (req, res) => {
  const id = req.query.id; 
  
  const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "config");
  console.log("Endpoint /api/getStatus chamado por:", req.headers.referer || "Desconhecido");
  
  try {
    let obj = await GaugeModel.findOne({ id_: "config" });
    
    // Verifica se obj existe
    if (!obj) {
      console.warn("Nenhum documento encontrado para 'sampling_config'");
      return res.status(404).json({ error: "Configuração não encontrada" });
    }
    const c_status = obj.status[`temp${id}`];


    res.json({ value: c_status });
    
  } catch (error) {
    console.error("Erro ao buscar valor:", error);
    res.status(500).json({ error: "Erro ao buscar valor" });
  }
});



const mqtt = require("mqtt");


const mqttClient = mqtt.connect("mqtts://8e8ca6be0c03462999d24017428566c5.s1.eu.hivemq.cloud:8883", {
  username: "admin",  // substitui pelo teu username do HiveMQ
  password: "Admin123",  // substitui pela tua password do HiveMQ
});


mqttClient.on("connect", () => {
  console.log("✅ Conectado ao Broker MQTT HiveMQ (SSL/TLS)");
});

mqttClient.on("error", (error) => {
  console.error("❌ Erro na conexão MQTT:", error);
});


app.post("/api/updateStatus", async (req, res) => {
  console.log("Endpoint /api/updateStatus chamado por:", req.headers.referer || "Desconhecido");

  const { value, id } = req.body; 

  const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "config");

  if (typeof value !== "boolean") {
    return res.status(400).json({ error: "Valor inválido" });
  }
  

  try {
    const newValue = value;

    // -------------------MQTT------------------------
    const topic = "config/temp" + id + "/status";
    const message = JSON.stringify({ status: newValue });

    mqttClient.publish(topic, message, { qos: 1 }, async (err) => {
      if (err) {
        console.error("Erro ao publicar mensagem MQTT:", err);
        return res.status(500).json({ error: "Erro ao publicar no MQTT" });
      }

      console.log(`MQTT: Frequência publicada no tópico ${topic}:`, newValue);

      // -------------------MongoDB------------------------
      const updateField = `status.temp${id}`;
      
      const updatedConfig = await GaugeModel.findOneAndUpdate(
        { id_: "config" },
        { $set: { [updateField]: newValue } },
        { new: true, upsert: true }
      );
      


      res.json({
        message: "Frequência publicada e atualizada com sucesso",
        newValue: updatedConfig.frequency,
      });
    });
  } catch (error) {
    console.error("Erro interno:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});


app.post("/api/updateRange", async(req,res) => {
  console.log("Endpoint /api/updateRange chamado por:", req.headers.referer || "Desconhecido");
  const {type , id, value} = req.body; 
  const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "config");

  if(isNaN(value)){
    return res.status(400).json("Valor incorreto para o range");
  }

  try {
    const newValue = Number(value);

    // ------------------------- MQTT -------------------------
    const topic = "config/temp" + id + "/range" + type;
    const message = JSON.stringify({ range: newValue });

    mqttClient.publish(topic, message, { qos: 1 }, async (err) => {
      if (err) {
        console.error("Erro ao publicar mensagem MQTT:", err);
        return res.status(500).json({ error: "Erro ao publicar no MQTT" });
      }

      console.log(`Frequência publicada no tópico ${topic}:`, newValue);

      //------------------------vMONGO DB ---------------------
      const updateField = `range.${id}.${type}`;
      console.log(updateField); 
      const updatedConfig = await GaugeModel.findOneAndUpdate(
        { id_: "config" },
        { $set: { [updateField]: newValue } },
        { new: true, upsert: true }
      );
  

      res.json({
        message: "Range publicado e atualizado com sucesso",
      });
    });
  } catch (error) {
    console.error("Erro interno:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});


app.post("/api/updateFreq", async (req, res) => {
  console.log("Endpoint /api/updateFreq chamado por:", req.headers.referer || "Desconhecido");

  const { value, id } = req.body; 

  const GaugeModel = mongoose.model("GaugeModel", GaugeSchema, "config");

  if (!value || isNaN(value)) {
    return res.status(400).json({ error: "Valor inválido" });
  }

  try {
    const newValue = Number(value);

    // Publica diretamente no tópico MQTT
    const topic = "config/temp" + id + "/freq";
    const message = JSON.stringify({ frequency: newValue });

    mqttClient.publish(topic, message, { qos: 1 }, async (err) => {
      if (err) {
        console.error("Erro ao publicar mensagem MQTT:", err);
        return res.status(500).json({ error: "Erro ao publicar no MQTT" });
      }

      console.log(`Frequência publicada no tópico ${topic}:`, newValue);

      // Atualiza APENAS o campo "frequency" no documento "sampling_config"
      const updateField = `frequency.temp${id}`;

      const updatedConfig = await GaugeModel.findOneAndUpdate(
        { id_: "config" },
        { $set: { [updateField]: newValue } },
        { new: true, upsert: true }
      );
      
      res.json({
        message: "Frequência publicada e atualizada com sucesso",
        newValue: updatedConfig.frequency,
      });
    });
  } catch (error) {
    console.error("Erro interno:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor a estutar http://${HOST}:${PORT}`);
});

