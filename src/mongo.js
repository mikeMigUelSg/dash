// mongo-test.mjs (ou mongo-test.js)
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://up202107620:admin@cluster0.vte55.mongodb.net/revPI?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ Ligação com MongoDB Atlas estabelecida com sucesso!");

    const database = client.db("revPI");
    const collections = await database.listCollections().toArray();
    console.log("📁 Coleções encontradas:", collections.map(c => c.name));
  } catch (err) {
    console.error("❌ Erro ao ligar ao MongoDB Atlas:");
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
