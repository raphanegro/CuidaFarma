// src/agents/medicine_search_agent.js

class MedicineSearchAgent {
  constructor() {
    this.name = "MedicineSearchAgent";
    this.description = "Agente de Busca - Encontra medicamentos por nome, tipo ou categoria";
    this.version = "1.0.0";
    
    this.medicamentos = [
      { id: 1, nome: "Dipirona", tipo: "Analgésico", categoria: "SUS" },
      { id: 2, nome: "Amoxicilina", tipo: "Antibiótico", categoria: "SUS" },
      { id: 3, nome: "Losartana", tipo: "Anti-hipertensivo", categoria: "SUS" },
    ];
  }

  async searchByName(medicineName) {
    console.log(`[MedicineSearchAgent] Buscando por nome: ${medicineName}`);
    const resultado = this.medicamentos.filter(m => 
      m.nome.toLowerCase().includes(medicineName.toLowerCase())
    );
    return { encontrados: resultado.length, resultados: resultado };
  }

  async searchByType(type) {
    console.log(`[MedicineSearchAgent] Buscando por tipo: ${type}`);
    const resultado = this.medicamentos.filter(m => 
      m.tipo.toLowerCase().includes(type.toLowerCase())
    );
    return { encontrados: resultado.length, resultados: resultado };
  }

  async listAll() {
    console.log("[MedicineSearchAgent] Listando todos os medicamentos");
    return { total: this.medicamentos.length, medicamentos: this.medicamentos };
  }
}

module.exports = MedicineSearchAgent;
