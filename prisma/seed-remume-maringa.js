#!/usr/bin/env node
/**
 * Seed: Medicamentos REMUME Maringá 2025/2026 — Componente Básico
 * Faz upsert (não duplica se já existir pelo nome).
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Carregar .env e usar DIRECT_URL
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^=]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
  }
}
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL

const prisma = new PrismaClient()

// Medicamentos do Componente Básico — REMUME Maringá 2025/2026
const REMUME_BASICO = [
  // A. Aparelho digestivo e metabolismo
  { dcb: 'carbonato de cálcio', dosagem: '1.250 mg (500 mg Ca)', forma: 'comprimido' },
  { dcb: 'carbonato de cálcio + colecalciferol', dosagem: '1.500 mg + 400 UI', forma: 'comprimido' },
  { dcb: 'cloridrato de metformina', dosagem: '500 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de metformina', dosagem: '850 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de metoclopramida', dosagem: '4 mg/mL', forma: 'solução oral' },
  { dcb: 'cloridrato de metoclopramida', dosagem: '5 mg/mL', forma: 'solução injetável' },
  { dcb: 'cloridrato de tiamina', dosagem: '300 mg', forma: 'comprimido' },
  { dcb: 'gliclazida', dosagem: '30 mg', forma: 'comprimido de liberação prolongada' },
  { dcb: 'insulina humana NPH', dosagem: '100 UI/mL', forma: 'suspensão injetável' },
  { dcb: 'insulina humana regular', dosagem: '100 UI/mL', forma: 'solução injetável' },
  { dcb: 'lactulose', dosagem: '667 mg/mL', forma: 'xarope' },
  { dcb: 'nistatina', dosagem: '100.000 UI/mL', forma: 'suspensão oral' },
  { dcb: 'omeprazol', dosagem: '20 mg', forma: 'cápsula' },
  { dcb: 'sais para reidratação oral', dosagem: '-', forma: 'pó para solução oral' },
  // B. Sangue e órgãos hematopoéticos
  { dcb: 'ácido acetilsalicílico', dosagem: '100 mg', forma: 'comprimido' },
  { dcb: 'ácido fólico', dosagem: '5 mg', forma: 'comprimido' },
  { dcb: 'cloreto de sódio', dosagem: '0,9%', forma: 'solução injetável' },
  { dcb: 'cloreto de sódio', dosagem: '20%', forma: 'solução injetável' },
  { dcb: 'heparina sódica', dosagem: '5.000 UI/0,25 mL', forma: 'solução injetável' },
  { dcb: 'solução ringer com lactato', dosagem: '-', forma: 'solução injetável' },
  { dcb: 'sulfato ferroso', dosagem: '40 mg', forma: 'comprimido' },
  { dcb: 'sulfato ferroso', dosagem: '25 mg/mL', forma: 'solução oral' },
  { dcb: 'varfarina sódica', dosagem: '5 mg', forma: 'comprimido' },
  // C. Aparelho cardiovascular
  { dcb: 'atenolol', dosagem: '50 mg', forma: 'comprimido' },
  { dcb: 'besilato de anlodipino', dosagem: '5 mg', forma: 'comprimido' },
  { dcb: 'captopril', dosagem: '25 mg', forma: 'comprimido' },
  { dcb: 'carvedilol', dosagem: '6,25 mg', forma: 'comprimido' },
  { dcb: 'carvedilol', dosagem: '25 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de amiodarona', dosagem: '200 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de lidocaína', dosagem: '20 mg/mL (2%)', forma: 'solução injetável' },
  { dcb: 'cloridrato de propranolol', dosagem: '40 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de verapamil', dosagem: '80 mg', forma: 'comprimido' },
  { dcb: 'digoxina', dosagem: '0,25 mg', forma: 'comprimido' },
  { dcb: 'dinitrato de isossorbida', dosagem: '5 mg', forma: 'comprimido sublingual' },
  { dcb: 'espironolactona', dosagem: '25 mg', forma: 'comprimido' },
  { dcb: 'espironolactona', dosagem: '100 mg', forma: 'comprimido' },
  { dcb: 'furosemida', dosagem: '40 mg', forma: 'comprimido' },
  { dcb: 'furosemida', dosagem: '10 mg/mL', forma: 'solução injetável' },
  { dcb: 'hemitartarato de epinefrina', dosagem: '1 mg/mL', forma: 'solução injetável' },
  { dcb: 'hidroclorotiazida', dosagem: '25 mg', forma: 'comprimido' },
  { dcb: 'losartana potássica', dosagem: '50 mg', forma: 'comprimido' },
  { dcb: 'maleato de enalapril', dosagem: '10 mg', forma: 'comprimido' },
  { dcb: 'maleato de enalapril', dosagem: '20 mg', forma: 'comprimido' },
  { dcb: 'mesilato de doxazosina', dosagem: '2 mg', forma: 'comprimido' },
  { dcb: 'metildopa', dosagem: '250 mg', forma: 'comprimido' },
  { dcb: 'mononitrato de isossorbida', dosagem: '40 mg', forma: 'comprimido' },
  { dcb: 'sinvastatina', dosagem: '20 mg', forma: 'comprimido' },
  { dcb: 'sinvastatina', dosagem: '40 mg', forma: 'comprimido' },
  { dcb: 'succinato de metoprolol', dosagem: '50 mg', forma: 'comprimido de liberação prolongada' },
  // D. Dermatológicos
  { dcb: 'acetato de dexametasona', dosagem: '1 mg/g (0,1%)', forma: 'creme' },
  { dcb: 'cetoconazol', dosagem: '20 mg/g (2%)', forma: 'xampu' },
  { dcb: 'cloridrato de lidocaína', dosagem: '20 mg/g (2%)', forma: 'gel' },
  { dcb: 'digliconato de clorexidina', dosagem: '2%', forma: 'solução aquosa tópica' },
  { dcb: 'imiquimode', dosagem: '50 mg/g', forma: 'creme dermatológico' },
  { dcb: 'nitrato de miconazol', dosagem: '20 mg/g (2%)', forma: 'creme dermatológico' },
  { dcb: 'pasta d\'água', dosagem: '-', forma: 'pasta' },
  { dcb: 'sulfadiazina de prata', dosagem: '10 mg/g (1%)', forma: 'creme' },
  // G. Geniturinário e hormônios sexuais
  { dcb: 'acetato de medroxiprogesterona', dosagem: '150 mg/mL', forma: 'suspensão injetável' },
  { dcb: 'enantato de noretisterona + valerato de estradiol', dosagem: '50 mg + 5 mg/mL', forma: 'solução injetável' },
  { dcb: 'estriol', dosagem: '1 mg/g', forma: 'creme vaginal' },
  { dcb: 'estrogênios conjugados', dosagem: '0,3 mg', forma: 'comprimido' },
  { dcb: 'finasterida', dosagem: '5 mg', forma: 'comprimido' },
  { dcb: 'levonorgestrel', dosagem: '0,75 mg', forma: 'comprimido' },
  { dcb: 'levonorgestrel + etinilestradiol', dosagem: '0,15 mg + 0,03 mg', forma: 'comprimido' },
  { dcb: 'metronidazol', dosagem: '100 mg/g (10%)', forma: 'gel vaginal' },
  { dcb: 'nitrato de miconazol', dosagem: '20 mg/g (2%)', forma: 'creme vaginal' },
  { dcb: 'noretisterona', dosagem: '0,35 mg', forma: 'comprimido' },
  // H. Hormonais sistêmicos
  { dcb: 'fosfato dissódico de dexametasona', dosagem: '4 mg/mL', forma: 'solução injetável' },
  { dcb: 'fosfato sódico de prednisolona', dosagem: '3 mg/mL', forma: 'solução oral' },
  { dcb: 'levotiroxina sódica', dosagem: '25 mcg', forma: 'comprimido' },
  { dcb: 'levotiroxina sódica', dosagem: '50 mcg', forma: 'comprimido' },
  { dcb: 'levotiroxina sódica', dosagem: '100 mcg', forma: 'comprimido' },
  { dcb: 'prednisona', dosagem: '5 mg', forma: 'comprimido' },
  { dcb: 'prednisona', dosagem: '20 mg', forma: 'comprimido' },
  { dcb: 'succinato sódico de hidrocortisona', dosagem: '100 mg', forma: 'pó para solução injetável' },
  { dcb: 'succinato sódico de hidrocortisona', dosagem: '500 mg', forma: 'pó para solução injetável' },
  // J. Anti-infecciosos
  { dcb: 'aciclovir', dosagem: '200 mg', forma: 'comprimido' },
  { dcb: 'amoxicilina', dosagem: '500 mg', forma: 'cápsula' },
  { dcb: 'amoxicilina', dosagem: '50 mg/mL', forma: 'suspensão oral' },
  { dcb: 'amoxicilina + clavulanato de potássio', dosagem: '500 mg + 125 mg', forma: 'comprimido' },
  { dcb: 'amoxicilina + clavulanato de potássio', dosagem: '50 mg + 12,5 mg/mL', forma: 'suspensão oral' },
  { dcb: 'azitromicina', dosagem: '500 mg', forma: 'comprimido' },
  { dcb: 'azitromicina', dosagem: '40 mg/mL', forma: 'suspensão oral' },
  { dcb: 'benzilpenicilina benzatina', dosagem: '1.200.000 UI', forma: 'pó para suspensão injetável' },
  { dcb: 'cefalexina', dosagem: '500 mg', forma: 'comprimido' },
  { dcb: 'cefalexina', dosagem: '50 mg/mL', forma: 'suspensão oral' },
  { dcb: 'claritromicina', dosagem: '500 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de ciprofloxacino', dosagem: '500 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de clindamicina', dosagem: '300 mg', forma: 'cápsula' },
  { dcb: 'estolato de eritromicina', dosagem: '50 mg/mL', forma: 'suspensão oral' },
  { dcb: 'fluconazol', dosagem: '150 mg', forma: 'cápsula' },
  { dcb: 'itraconazol', dosagem: '100 mg', forma: 'cápsula' },
  { dcb: 'metronidazol', dosagem: '250 mg', forma: 'comprimido' },
  { dcb: 'nitrofurantoína', dosagem: '100 mg', forma: 'cápsula' },
  { dcb: 'sulfametoxazol + trimetoprima', dosagem: '400 mg + 80 mg', forma: 'comprimido' },
  { dcb: 'sulfametoxazol + trimetoprima', dosagem: '40 mg + 8 mg/mL', forma: 'suspensão oral' },
  // M. Sistema musculoesquelético
  { dcb: 'alendronato de sódio', dosagem: '70 mg', forma: 'comprimido' },
  { dcb: 'alopurinol', dosagem: '300 mg', forma: 'comprimido' },
  { dcb: 'ibuprofeno', dosagem: '600 mg', forma: 'comprimido' },
  { dcb: 'ibuprofeno', dosagem: '50 mg/mL', forma: 'suspensão oral' },
  // N. Sistema nervoso
  { dcb: 'carbamazepina', dosagem: '200 mg', forma: 'comprimido' },
  { dcb: 'carbamazepina', dosagem: '20 mg/mL', forma: 'suspensão oral' },
  { dcb: 'carbonato de lítio', dosagem: '300 mg', forma: 'comprimido' },
  { dcb: 'clonazepam', dosagem: '2,5 mg/mL', forma: 'solução oral' },
  { dcb: 'cloridrato de amitriptilina', dosagem: '25 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de biperideno', dosagem: '2 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de clomipramina', dosagem: '25 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de clorpromazina', dosagem: '25 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de clorpromazina', dosagem: '100 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de clorpromazina', dosagem: '40 mg/mL', forma: 'solução oral' },
  { dcb: 'cloridrato de fluoxetina', dosagem: '20 mg', forma: 'cápsula' },
  { dcb: 'cloridrato de nortriptilina', dosagem: '25 mg', forma: 'comprimido' },
  { dcb: 'decanoato de haloperidol', dosagem: '50 mg/mL', forma: 'solução injetável' },
  { dcb: 'diazepam', dosagem: '5 mg', forma: 'comprimido' },
  { dcb: 'diazepam', dosagem: '5 mg/mL', forma: 'solução injetável' },
  { dcb: 'dipirona sódica', dosagem: '500 mg/mL', forma: 'solução oral' },
  { dcb: 'dipirona sódica', dosagem: '500 mg/mL', forma: 'solução injetável' },
  { dcb: 'fenitoína sódica', dosagem: '100 mg', forma: 'comprimido' },
  { dcb: 'fenitoína sódica', dosagem: '50 mg/mL', forma: 'solução injetável' },
  { dcb: 'fenobarbital', dosagem: '100 mg', forma: 'comprimido' },
  { dcb: 'fenobarbital', dosagem: '40 mg/mL', forma: 'solução oral' },
  { dcb: 'fenobarbital', dosagem: '100 mg/mL', forma: 'solução injetável' },
  { dcb: 'haloperidol', dosagem: '1 mg', forma: 'comprimido' },
  { dcb: 'haloperidol', dosagem: '5 mg', forma: 'comprimido' },
  { dcb: 'haloperidol', dosagem: '2 mg/mL', forma: 'solução oral' },
  { dcb: 'haloperidol', dosagem: '5 mg/mL', forma: 'solução injetável' },
  { dcb: 'levodopa + benserazida', dosagem: '100 mg + 25 mg', forma: 'comprimido' },
  { dcb: 'levodopa + benserazida', dosagem: '200 mg + 50 mg', forma: 'comprimido' },
  { dcb: 'levodopa + carbidopa', dosagem: '250 mg + 25 mg', forma: 'comprimido' },
  { dcb: 'paracetamol', dosagem: '500 mg', forma: 'comprimido' },
  { dcb: 'paracetamol', dosagem: '200 mg/mL', forma: 'solução oral' },
  { dcb: 'valproato de sódio', dosagem: '250 mg', forma: 'cápsula' },
  { dcb: 'valproato de sódio', dosagem: '500 mg', forma: 'comprimido' },
  { dcb: 'valproato de sódio', dosagem: '50 mg/mL', forma: 'solução oral' },
  // P. Antiparasitários
  { dcb: 'albendazol', dosagem: '400 mg', forma: 'comprimido mastigável' },
  { dcb: 'albendazol', dosagem: '40 mg/mL', forma: 'suspensão oral' },
  { dcb: 'benzoilmetronidazol', dosagem: '40 mg/mL', forma: 'suspensão oral' },
  { dcb: 'ivermectina', dosagem: '6 mg', forma: 'comprimido' },
  { dcb: 'permetrina', dosagem: '10 mg/mL (1%)', forma: 'loção' },
  { dcb: 'permetrina', dosagem: '50 mg/mL (5%)', forma: 'loção' },
  // R. Aparelho respiratório
  { dcb: 'brometo de ipratrópio', dosagem: '0,25 mg/mL', forma: 'solução para inalação' },
  { dcb: 'budesonida', dosagem: '32 mcg/dose', forma: 'suspensão nasal' },
  { dcb: 'cloreto de sódio', dosagem: '0,9%', forma: 'solução nasal' },
  { dcb: 'cloridrato de prometazina', dosagem: '25 mg', forma: 'comprimido' },
  { dcb: 'cloridrato de prometazina', dosagem: '25 mg/mL', forma: 'solução injetável' },
  { dcb: 'dipropionato de beclometasona', dosagem: '50 mcg/dose', forma: 'suspensão nasal' },
  { dcb: 'dipropionato de beclometasona', dosagem: '50 mcg/dose', forma: 'solução para inalação oral' },
  { dcb: 'dipropionato de beclometasona', dosagem: '250 mcg/dose', forma: 'solução para inalação oral' },
  { dcb: 'loratadina', dosagem: '10 mg', forma: 'comprimido' },
  { dcb: 'loratadina', dosagem: '1 mg/mL', forma: 'xarope' },
  { dcb: 'maleato de dexclorfeniramina', dosagem: '0,4 mg/mL', forma: 'solução oral' },
  { dcb: 'sulfato de salbutamol', dosagem: '100 mcg/dose', forma: 'aerossol oral' },
  // S. Órgãos sensitivos
  { dcb: 'hipromelose', dosagem: '3 mg/mL (0,3%)', forma: 'solução oftálmica' },
  { dcb: 'sulfato de gentamicina', dosagem: '5 mg/mL', forma: 'solução oftálmica' },
  { dcb: 'sulfato de polimixina B + sulfato de neomicina + fluocinolona + lidocaína', dosagem: '10.000 UI + 3,5 mg + 0,25 mg + 20 mg/mL', forma: 'solução otológica' },
  // V. Vários
  { dcb: 'água para injetáveis', dosagem: '-', forma: 'solução injetável' },
  { dcb: 'glicose', dosagem: '50 mg/mL (5%)', forma: 'solução injetável' },
  { dcb: 'glicose', dosagem: '250 mg/mL (25%)', forma: 'solução injetável' },
  { dcb: 'glicose', dosagem: '500 mg/mL (50%)', forma: 'solução injetável' },
  // Fitoterápicos
  { dcb: 'espinheira santa', dosagem: '60-90 mg taninos', forma: 'cápsula' },
  { dcb: 'guaco', dosagem: '0,5-5 mg cumarina', forma: 'xarope' },
  { dcb: 'isoflavona de soja', dosagem: '50-120 mg', forma: 'cápsula' },
]

function gerarNome(dcb, dosagem, forma) {
  const parts = [dcb]
  if (dosagem && dosagem !== '-') parts.push(dosagem)
  if (forma && forma !== '-') parts.push(`(${forma})`)
  return parts.join(' ')
}

async function main() {
  console.log(`Iniciando seed REMUME Maringá Básico: ${REMUME_BASICO.length} medicamentos`)

  let inseridos = 0
  let ignorados = 0

  for (const med of REMUME_BASICO) {
    const nome = gerarNome(med.dcb, med.dosagem, med.forma)
    try {
      await prisma.medicamento.upsert({
        where: { nome },
        update: {},
        create: {
          nome,
          principioAtivo: med.dcb,
          dosagem: med.dosagem !== '-' ? med.dosagem : null,
          forma: med.forma !== '-' ? med.forma : null,
          componente: 'Básico',
        },
      })
      inseridos++
    } catch {
      ignorados++
    }
  }

  const total = await prisma.medicamento.count({ where: { componente: 'Básico' } })
  console.log(`\nConcluído!`)
  console.log(`Processados: ${inseridos} | Erros: ${ignorados}`)
  console.log(`Total Básico na base: ${total}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
