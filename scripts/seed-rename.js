#!/usr/bin/env node
/**
 * Seed RENAME 2024 usando pg direto (sem Prisma client)
 * Faz upsert via SQL puro — evita bloqueio do DLL Prisma
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Carregar .env
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '')
  }
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL ou DIRECT_URL não encontrada no .env')
  process.exit(1)
}

const COMPONENTES_INCLUIDOS = new Set(['Básico', 'Especializado', 'Estratégico'])

function cleanDcb(dcb) {
  return dcb
    .replace(/\s+\d[\d.,/ ]*\s*(mg|mcg|UI|g\b|mL|U\b|%)[^a-záéíóú]*/i, '')
    .replace(/\s+\(\d[\d.,]+[^)]*\)/g, '')
    .trim()
}

function gerarNome(dcb, conc, forma) {
  const parts = [cleanDcb(dcb)]
  if (conc && conc !== '-') parts.push(conc)
  if (forma && forma !== '-') parts.push(`(${forma})`)
  return parts.join(' ')
}

async function main() {
  const rawPath = path.join(__dirname, '..', 'rename_parsed.json')
  if (!fs.existsSync(rawPath)) {
    console.error('rename_parsed.json não encontrado. Execute: node scripts/parse-rename.js')
    process.exit(1)
  }

  const entries = JSON.parse(fs.readFileSync(rawPath, 'utf8'))

  // Filtrar
  const filtered = entries.filter(e =>
    COMPONENTES_INCLUIDOS.has(e.componente) &&
    e.dcb &&
    e.dcb.length < 120 &&
    !/MINISTÉRIO|RELAÇÃO|RENAME|FARMACÊUTICA|FINANCIAMENTO/i.test(e.dcb) &&
    !/micronutrientes|sachê de \d|cada \d/.test(e.dcb)
  )

  // Deduplicar por nome
  const seen = new Set()
  const unique = []
  for (const e of filtered) {
    const nome = gerarNome(e.dcb, e.concentracao, e.formaFarmaceutica)
    if (!seen.has(nome)) {
      seen.add(nome)
      unique.push({ ...e, nomeGerado: nome })
    }
  }

  console.log(`Registros para inserir: ${unique.length}`)

  const client = new Client({ connectionString })
  await client.connect()
  console.log('Conectado ao banco de dados.')

  let ok = 0
  let err = 0
  const BATCH = 50

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH)

    await Promise.all(batch.map(async (e) => {
      const nome = e.nomeGerado
      const principioAtivo = cleanDcb(e.dcb)
      const dosagem = e.concentracao !== '-' ? e.concentracao : ''
      const forma = e.formaFarmaceutica !== '-' ? e.formaFarmaceutica : ''
      const codigoATC = e.codigoAtc
      const componente = e.componente

      try {
        await client.query(`
          INSERT INTO medicamentos (id, nome, "principioAtivo", dosagem, forma, "codigoATC", componente, "criadoEm", "atualizadoEm")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now(), now())
          ON CONFLICT (nome)
          DO UPDATE SET
            "principioAtivo" = EXCLUDED."principioAtivo",
            dosagem = EXCLUDED.dosagem,
            forma = EXCLUDED.forma,
            "codigoATC" = EXCLUDED."codigoATC",
            componente = EXCLUDED.componente,
            "atualizadoEm" = now()
        `, [nome, principioAtivo, dosagem, forma, codigoATC, componente])
        ok++
      } catch (ex) {
        err++
        console.error(`Erro em "${nome}":`, ex.message)
      }
    }))

    process.stdout.write(`\r${Math.min(i + BATCH, unique.length)}/${unique.length} processados...`)
  }

  console.log(`\n\nSeed concluído! OK: ${ok}, Erros: ${err}`)

  // Totais
  const res = await client.query('SELECT componente, count(*) FROM medicamentos GROUP BY componente ORDER BY componente')
  console.log('\nMedicamentos por componente:')
  for (const row of res.rows) {
    console.log(`  ${row.componente || '(sem componente)'}: ${row.count}`)
  }

  const total = await client.query('SELECT count(*) FROM medicamentos')
  console.log(`Total: ${total.rows[0].count}`)

  await client.end()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
