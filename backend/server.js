

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


app.get('/api/temp24', async (req, res) => {
  try {
    const startDate = new Date(req.query.beg);
    const endDate = new Date(req.query.end);
    const sensorId = req.query.id;

    console.log("Endpoint /api/temp24 chamado por:", req.headers.referer || "Desconhecido");
    console.log("Sensor ID:", sensorId);
    console.log("Start Date:", startDate.toISOString());
    console.log("End Date:", endDate.toISOString());

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const allResults = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const chunkStart = Math.max(startDate.getTime(), dayStart.getTime());
      const chunkEnd = Math.min(endDate.getTime(), dayEnd.getTime());

      const collectionName = `raw_${dayStart.getDate()}_${dayStart.getMonth() + 1}_${dayStart.getFullYear()}`;

      try {
        const collection = mongoose.connection.db.collection(collectionName);

        const dailyResult = await collection.aggregate([
          {
            $match: {
              date: { $gte: chunkStart, $lte: chunkEnd },
              id: sensorId,
              value: { $lt: 100 }
            }
          },
          {
            $bucketAuto: {
              groupBy: "$date",
              buckets: 1000, // max 1000 even buckets
              output: {
                avgValue: { $avg: "$value" },
                date: { $first: "$date" }
              }
            }
          },
          {
            $sort: { date: 1 }
          }
        ]).toArray();

        allResults.push(...dailyResult);
      } catch (err) {
        console.warn(`Collection ${collectionName} not found or failed.`);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (allResults.length === 0) {
      return res.status(404).json({ error: "No data found for the last 24 hours." });
    }

    // Calculate statistics
    const values = allResults.map(r => r.avgValue);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

    const result = {
      mean: parseFloat(mean.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      std: parseFloat(std.toFixed(2)),
      samples: allResults.map(r => ({ timestamp: r.date, value: parseFloat(r.avgValue.toFixed(2)) }))
    };
    

    res.json(result);
  } catch (error) {
    console.error("Error in /api/temp24:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// SUPER SIMPLE tempStats endpoint
app.get('/api/tempStats', async (req, res) => {
  try {
    const startDate = new Date(req.query.beg);
    const endDate = new Date(req.query.end);
    const sensorId = req.query.id;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const allValues = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const collectionName = `raw_${dayStart.getDate()}_${dayStart.getMonth() + 1}_${dayStart.getFullYear()}`;

      try {
        const collection = mongoose.connection.db.collection(collectionName);
        
        const dailyData = await collection.find({
          date: { $gte: dayStart.getTime(), $lte: dayEnd.getTime() },
          id: sensorId,
          value: { $lt: 100 }
        }).sort({ date: 1 }).toArray(); 
        
        // Add only the values
        dailyData.forEach(item => allValues.push(item.value));

      } catch (err) {
        console.log(`No data found for ${collectionName}, skipping...`);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (allValues.length === 0) {
      return res.status(404).json({ error: "No data found for the given interval." });
    }

    
    let sampledValues;
    if (allValues.length <= 1000) {
      sampledValues = allValues;
    } else {
      const step = allValues.length / 1000;
      sampledValues = Array.from({ length: 1000 }, (_, i) => allValues[Math.floor(i * step)]);
    }

    // Compute stats
    const mean = sampledValues.reduce((sum, val) => sum + val, 0) / sampledValues.length;
    const min = Math.min(...sampledValues);
    const max = Math.max(...sampledValues);
    const std = Math.sqrt(sampledValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sampledValues.length);

    const result = {
      mean: parseFloat(mean.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      std: parseFloat(std.toFixed(2))
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



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
  
    // Parse query dates
    const startDate = new Date(req.query.beg);
    const endDate   = new Date(req.query.end);
    console.log("Range:", startDate, "→", endDate);
  
    // Prepare arrays for your Mongo results
    const results  = [];
    const results2 = [];
  
    try {
      // 1) Fetch Mongo data per day
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const collectionName = `raw_${d.getDate()}_${d.getMonth()+1}_${d.getFullYear()}`;
        const GaugeModel     = mongoose.model("GaugeModel", GaugeSchema, collectionName);
  
        // Bounds for this day
        const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
        const dayEnd   = new Date(d); dayEnd.setHours(23,59,59,999);
  
        // Helper to run one aggregation
        const runAgg = async (id) => {
          return GaugeModel.aggregate([
            { $match: {
                date: { $gte: dayStart.getTime(), $lte: dayEnd.getTime() },
                id,
                value: { $lt: 100 }
            }},
            { $bucketAuto: {
                groupBy: "$date",
                buckets: 100,
                output: {
                  avgValue:  { $avg: "$value" },
                  firstValue:{ $first: "$value" },
                  date:       { $first: "$date" }
                }
            }},
            { $sort: { date: 1 } }
          ]);
        };
  
        // Get data for id="1" and id="2"
        results.push(...await runAgg("1"));
        results2.push(...await runAgg("2"));
      }
  
      // 2) Fetch historical hourly temperature for Porto
      // Format YYYY-MM-DD
      const fmt = (d) => d.toISOString().slice(0,10);
      const portoLat = 41.1579;
      const portoLon = -8.6291;
      const weatherUrl = `https://archive-api.open-meteo.com/v1/archive`
        + `?latitude=${portoLat}`
        + `&longitude=${portoLon}`
        + `&start_date=${fmt(startDate)}`
        + `&end_date=${fmt(endDate)}`
        + `&hourly=temperature_2m`;
  
      console.log("Fetching Porto weather:", weatherUrl);
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) {
        throw new Error(`Open-Meteo API error: ${weatherRes.status} ${weatherRes.statusText}`);
      }
      const weatherData = await weatherRes.json();

      console.log("Weather data:", weatherData);  
      // weatherData.hourly.time: [ "2025-05-01T00:00", ... ]
      // weatherData.hourly.temperature_2m: [ 15.3, ... ]
  
      // 3) Send combined JSON
      res.json({
        value:  results,
        value2: results2,
        portoHourly: {
          time:        weatherData.hourly.time,
          temperature: weatherData.hourly.temperature_2m
        }
      });
  
    } catch (error) {
      console.error("Erro na agregação ou fetch:", error);
      res.status(500).json({ error: error.message });
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

