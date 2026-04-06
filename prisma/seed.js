#!/usr/bin/env node
/**
 * Seed: Medicamentos RENAME 2024
 * Faz upsert de todos os medicamentos do Componente Básico, Especializado e Estratégico.
 * Fonte: rename_parsed.json (gerado por scripts/parse-rename.js)
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Carregar .env manualmente e usar DIRECT_URL para seed (evita pgBouncer pooler)
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^=]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
  }
}
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL
}

const prisma = new PrismaClient()

// Componentes a incluir no seed
const COMPONENTES_INCLUIDOS = ['Básico', 'Especializado', 'Estratégico']

// DCBs com nomes problemáticos (mistura de concentração no nome) — limpar
function cleanDcb(dcb) {
  // Remover concentrações que vazaram no nome (ex: "fator VII... 1 mg (50.000 UI)")
  return dcb
    .replace(/\s+\d[\d.,/ ]*\s*(mg|mcg|UI|g|mL|U|%)[^a-z]*/i, '')
    .replace(/\s+\(\d[\d.,]+[^\)]*\)/g, '')
    .trim()
}

// Gerar nome único: DCB + concentração (se disponível)
function gerarNome(dcb, concentracao, forma) {
  const dcbClean = cleanDcb(dcb)
  const parts = [dcbClean]
  if (concentracao && concentracao !== '-') parts.push(concentracao)
  if (forma && forma !== '-') parts.push(`(${forma})`)
  return parts.join(' ')
}

async function main() {
  const rawPath = path.join(__dirname, '..', 'rename_parsed.json')
  if (!fs.existsSync(rawPath)) {
    console.error('Arquivo rename_parsed.json não encontrado. Execute scripts/parse-rename.js primeiro.')
    process.exit(1)
  }

  const entries = JSON.parse(fs.readFileSync(rawPath, 'utf8'))

  // Filtrar e limpar
  const filtered = entries.filter(e =>
    COMPONENTES_INCLUIDOS.includes(e.componente) &&
    e.dcb &&
    e.dcb.length < 120 &&
    !/MINISTÉRIO|RELAÇÃO|RENAME|FARMACÊUTICA|FINANCIAMENTO/i.test(e.dcb)
  )

  console.log(`Entradas filtradas: ${filtered.length} de ${entries.length}`)

  // Remover duplicatas por nome gerado
  const seen = new Set()
  const unique = []
  for (const e of filtered) {
    const nome = gerarNome(e.dcb, e.concentracao, e.formaFarmaceutica)
    if (!seen.has(nome)) {
      seen.add(nome)
      unique.push({ ...e, nomeGerado: nome })
    }
  }
  console.log(`Entradas únicas: ${unique.length}`)

  // Upsert em batches de 50
  let created = 0
  let updated = 0
  const BATCH = 50

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH)
    await Promise.all(batch.map(async (e) => {
      const result = await prisma.medicamento.upsert({
        where: { nome: e.nomeGerado },
        update: {
          principioAtivo: cleanDcb(e.dcb),
          dosagem: e.concentracao !== '-' ? e.concentracao : '',
          forma: e.formaFarmaceutica !== '-' ? e.formaFarmaceutica : '',
          codigoATC: e.codigoAtc,
          componente: e.componente,
        },
        create: {
          nome: e.nomeGerado,
          principioAtivo: cleanDcb(e.dcb),
          dosagem: e.concentracao !== '-' ? e.concentracao : '',
          forma: e.formaFarmaceutica !== '-' ? e.formaFarmaceutica : '',
          codigoATC: e.codigoAtc,
          componente: e.componente,
        },
      })
      // Prisma upsert não retorna se foi create ou update — usar contagem aproximada
    }))
    process.stdout.write(`\rProcessado: ${Math.min(i + BATCH, unique.length)}/${unique.length}`)
  }

  console.log('\n\nSeed concluído!')

  // Totais finais
  const total = await prisma.medicamento.count()
  const porComponente = await prisma.medicamento.groupBy({
    by: ['componente'],
    _count: { id: true },
  })
  console.log(`Total na base: ${total}`)
  console.log('Por componente:', porComponente.map(r => `${r.componente}: ${r._count.id}`).join(', '))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
