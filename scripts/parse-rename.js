#!/usr/bin/env node
/**
 * Parser para RENAME 2024 (rename_raw.txt)
 * Extrai DCB, concentração, forma farmacêutica, componente e ATC
 * Foco: Básico, Especializado e Estratégico
 */

const fs = require('fs')
const path = require('path')

const raw = fs.readFileSync(path.join(__dirname, '..', 'rename_raw.txt'), 'utf8')

// 1. Limpar ruído de cabeçalhos, rodapés e separadores de página
let text = raw
  .replace(/===PAGE\d+===/g, ' ')
  .replace(/\| \d+ RELAÇÃO NACIONAL DE MEDICAMENTOS ESSENCIAIS \| RENAME \d+/g, ' ')
  .replace(/\| \d+ MINISTÉRIO DA SAÚDE/g, ' ')
  .replace(/Denominação Comum Brasileira \(DCB\)[^\n]*?Código ATC/g, ' ')
  // Remover rodapés de página: "continua", "continuação"
  .replace(/continu\S*/g, ' ')
  // Remover notas de rodapé (1), (2)...
  .replace(/\(\d+\)/g, ' ')
  // Normalizar espaços múltiplos
  .replace(/\s+/g, ' ')
  .trim()

// 2. Remover seção headers ATC nível 1: "A: Aparelho digestivo e metabolismo"
//    Aparecem antes dos primeiros itens de cada seção
const SECTION_HEADERS = [
  /A: Aparelho digestivo e metabolismo/g,
  /B: Sangue e órgãos hematopoiéticos/g,
  /C: Aparelho cardiovascular/g,
  /D: Medicamentos dermatológicos/g,
  /G: Aparelho geniturinário e hormônios sexuais/g,
  /H: Preparações hormonais sistêmicas/g,
  /J: Anti-?infecciosos[^A-Z]*/g,
  /L: Agentes antineoplásicos e imunomoduladores/g,
  /M: Sistema musculoesquelético/g,
  /N: Sistema nervoso/g,
  /P: Produtos antiparasitários[^A-Z]*/g,
  /R: Aparelho respiratório/g,
  /S: Órgãos (dos sentidos|sensitivos)/g,
  /V: Vários/g,
]
for (const re of SECTION_HEADERS) text = text.replace(re, ' ')
text = text.replace(/\s+/g, ' ').trim()

// 3. Componentes válidos (em ordem do mais longo para o mais curto para evitar match parcial)
const COMPONENTES = [
  'Insumos (Estratégico)',
  'Especializado e Procedimento Hospitalar',
  'Especializado',
  'Estratégico',
  'Hospitalar',
  'Insumos',
  'Básico',
]

// 4. Formas farmacêuticas (ordenadas do mais longo para o mais curto)
const FORMAS = [
  'pó para solução injetável',
  'pó para suspensão oral',
  'pó para suspensão injetável',
  'pó para solução para infusão',
  'pó para solução',
  'suspensão injetável de ação prolongada',
  'suspensão injetável',
  'suspensão oral',
  'solução injetável de uso subcutâneo',
  'solução injetável',
  'solução para infusão',
  'solução oftálmica',
  'solução oral',
  'solução',
  'comprimido de liberação prolongada',
  'comprimido orodispersível',
  'comprimido revestido',
  'comprimido',
  'cápsula de liberação prolongada',
  'cápsula dura',
  'cápsula',
  'adesivo transdérmico',
  'aerossol para inalação',
  'pó inalatório',
  'spray nasal',
  'xarope',
  'supositório',
  'pomada',
  'creme',
  'gel',
  'emulsão',
  'drágea',
  'granulado',
  'sachê',
  'implante',
  'tintura',
  'elixir',
]
const FORMAS_RE = new RegExp(FORMAS.map(f => f.replace(/\s+/g, '\\s+')).join('|'), 'i')

// 5. Dividir em segments por código ATC
const segments = []
const atcRe = /([A-Z]\d{2}[A-Z]{2}\d{2})\b/g
let lastEnd = 0
let m

while ((m = atcRe.exec(text)) !== null) {
  segments.push({ text: text.slice(lastEnd, m.index).trim(), atc: m[1] })
  lastEnd = m.index + m[0].length
}

// 6. Extrair componente de uma string
function findComponent(str) {
  for (const comp of COMPONENTES) {
    const idx = str.lastIndexOf(comp)
    if (idx !== -1) return { comp, idx }
  }
  return null
}

// 7. Tentar separar DCB novo de concentração
//    Um DCB novo começa com letra minúscula (nomes de substâncias)
//    Uma concentração começa com dígito ou traço
function splitDcbFromConc(str) {
  // Padrão: "nome dcb conc..."
  // Concentração começa com dígito ou "-" ou "(" (parentético)
  const match = str.match(/^([a-záéíóúàãõâêôçüÁÉÍÓÚÀÃÕÂÊÔÇ][a-záéíóúàãõâêôçüÁÉÍÓÚÀÃÕÂÊÔÇ0-9 \-+\/,.'()]+?)\s+(\d[\s\S]*)$/)
  if (match) {
    return { dcb: match[1].trim(), conc: match[2].trim() }
  }
  // Tudo é DCB (sem concentração aparente)
  if (/^[a-záéíóúàãõâêôç]/i.test(str)) {
    return { dcb: str.trim(), conc: '-' }
  }
  return null
}

// 8. Parsear cada segmento
const entries = []
let currentDcb = ''

for (const { text: seg, atc } of segments) {
  const compResult = findComponent(seg)
  if (!compResult) continue

  const { comp, idx } = compResult
  const beforeComp = seg.slice(0, idx).trim()

  // Encontrar forma farmacêutica
  const formaMatch = FORMAS_RE.exec(beforeComp)

  let conc = ''
  let forma = ''

  if (formaMatch) {
    forma = formaMatch[0].trim()
    const beforeForma = beforeComp.slice(0, formaMatch.index).trim()

    // Verificar se beforeForma começa com letra (novo DCB) ou número (continuação)
    if (/^[a-záéíóúàãõâêôç]/i.test(beforeForma)) {
      const split = splitDcbFromConc(beforeForma)
      if (split) {
        currentDcb = split.dcb
        conc = split.conc
      } else {
        currentDcb = beforeForma
        conc = '-'
      }
    } else {
      // Continuação: beforeForma é a concentração
      conc = beforeForma || '-'
    }
  } else {
    // Sem forma reconhecida
    if (/^[a-záéíóúàãõâêôç]/i.test(beforeComp)) {
      const split = splitDcbFromConc(beforeComp)
      if (split) {
        currentDcb = split.dcb
        conc = split.conc
      } else {
        currentDcb = beforeComp
        conc = '-'
      }
      forma = '-'
    } else {
      conc = beforeComp || '-'
      forma = '-'
    }
  }

  if (!currentDcb) continue

  // Filtrar ruído
  const dcbClean = currentDcb.replace(/\s+/g, ' ').trim()
  if (dcbClean.length > 120) continue
  if (/MINISTÉRIO|RELAÇÃO|RENAME|NACIONAL|FARMACÊUTICA|FINANCIAMENTO|SAÚDE/i.test(dcbClean)) continue
  if (/^\d/.test(dcbClean)) continue
  // Filtrar fitoterápicos com formato especial
  if (/micronutrientes|sachê de \d|cada \d/.test(dcbClean)) continue

  entries.push({
    dcb: dcbClean,
    concentracao: (conc || '-').replace(/\s+/g, ' ').trim(),
    formaFarmaceutica: (forma || '-').trim(),
    componente: comp,
    codigoAtc: atc,
  })
}

// 9. Estatísticas
console.log(`\nTotal entradas: ${entries.length}`)
const counts = {}
for (const e of entries) counts[e.componente] = (counts[e.componente] || 0) + 1
console.log('Por componente:', counts)

const uniqueDcbs = [...new Set(entries.map(e => e.dcb))]
console.log(`DCBs únicos: ${uniqueDcbs.length}`)

console.log('\nPrimeiras 30:')
entries.slice(0, 30).forEach((e, i) =>
  console.log(`${i + 1}. [${e.componente}] "${e.dcb}" | "${e.concentracao}" | "${e.formaFarmaceutica}" | ${e.codigoAtc}`)
)

console.log('\nAmostras de problemas (DCBs com mais de 60 chars):')
entries.filter(e => e.dcb.length > 60).slice(0, 10).forEach(e =>
  console.log(`  "${e.dcb}"`)
)

console.log('\nÚltimas 10:')
entries.slice(-10).forEach((e, i) =>
  console.log(`${entries.length - 10 + i + 1}. [${e.componente}] "${e.dcb}" | "${e.concentracao}" | ${e.codigoAtc}`)
)

fs.writeFileSync(path.join(__dirname, '..', 'rename_parsed.json'), JSON.stringify(entries, null, 2))
console.log('\nSalvo em rename_parsed.json')
