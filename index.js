// index.js
// Arquivo principal do projeto CuidaFarma
// Integra todos os agentes AIOS

const PharmacyAgent = require("./src/agents/pharmacy_agent");
const MedicineSearchAgent = require("./src/agents/medicine_search_agent");

console.log("================================");
console.log("🏥 CuidaFarma iniciado!");
console.log("Sistema de Guia Farmacêutico SUS");
console.log("================================\n");

// Instanciar agentes
const pharmacyAgent = new PharmacyAgent();
const medicineSearchAgent = new MedicineSearchAgent();

console.log("✅ Agentes carregados:");
console.log("   - PharmacyAgent");
console.log("   - MedicineSearchAgent\n");

// Demonstração de uso
async function demonstracao() {
  console.log("--- Teste de Busca de Medicamentos ---\n");
  
  const resultados = await medicineSearchAgent.searchByName("Dipirona");
  console.log("Resultado da busca:", resultados);
  console.log();
  
  const todos = await medicineSearchAgent.listAll();
  console.log("Total de medicamentos:", todos.total);
}

demonstracao().catch(console.error);
