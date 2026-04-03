# CuidaFarma — Backlog do Projeto

**Spec:** IDEA-993B9D96
**Versão atual:** 1.0 (autenticação, pacientes, medicamentos catálogo, análises básicas + Claude AI)
**Stack:** Next.js 16 + TypeScript + Prisma + PostgreSQL + NextAuth + Claude API

---

## Ordem de Execução Recomendada

```
Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5
```

Stories dentro de cada epic devem ser implementadas em ordem numérica por dependência.

---

## Epic 1: Prontuário Farmacêutico ← **INICIAR AQUI**

> Fundação do prontuário clínico. Todas as outras funcionalidades dependem disso.

| Story | Módulo | FR | Tamanho | Dep |
|-------|--------|----|---------|-----|
| [1.1](active/1.1.story.md) | Melhorar Cadastro de Paciente | FR-2 | M | — |
| [1.2](active/1.2.story.md) | Tipo de Atendimento | FR-3 | S | 1.1 |
| [1.3](active/1.3.story.md) | Motivo da Consulta | FR-4 | S | 1.2 |
| [1.4](active/1.4.story.md) | Histórico Clínico | FR-5 | M | 1.1 |
| [1.5](active/1.5.story.md) | Dados Clínicos | FR-6 | M | 1.2 |

---

## Epic 2: Farmacoterapia

> Núcleo clínico: medicamentos em uso, exames, análise e PRMs.

| Story | Módulo | FR | Tamanho | Dep |
|-------|--------|----|---------|-----|
| [2.1](active/2.1.story.md) | Resultados de Exames | FR-7 | M | 1.1 |
| [2.2](active/2.2.story.md) | Medicamentos em Uso | FR-8 | M | 1.1 |
| [2.3](active/2.3.story.md) | Análise Farmacoterapêutica Completa | FR-9 | L | 2.2, 1.5 |
| [2.4](active/2.4.story.md) | Registro de PRM/PRF | FR-12, FR-21 | M | 2.2, 2.3 |

---

## Epic 3: Intervenção e Acompanhamento

> Fecha o ciclo do cuidado farmacêutico.

| Story | Módulo | FR | Tamanho | Dep |
|-------|--------|----|---------|-----|
| [3.1](active/3.1.story.md) | Intervenção Farmacêutica | FR-14 | M | 2.4 |
| [3.2](active/3.2.story.md) | Calendário Posológico | FR-15 | L | 2.2 |
| [3.3](active/3.3.story.md) | Estratificação de Risco | FR-16 | M | 1.4, 2.2, 2.4 |
| [3.4](active/3.4.story.md) | Plano de Acompanhamento | FR-17 | S | 1.1 |
| [3.5](active/3.5.story.md) | Evolução Clínica | FR-18 | M | 1.5, 2.4 |

---

## Epic 4: Assistente Clínico e Documentos

> IA clínica + documentos digitalizados.

| Story | Módulo | FR | Tamanho | Dep |
|-------|--------|----|---------|-----|
| [4.1](active/4.1.story.md) | Upload e Gestão de Anexos | FR-11, FR-20, FR-23 | L | 1.1 |
| [4.2](active/4.2.story.md) | Sugestões do Assistente Clínico | FR-13 | L | 2.1, 2.2, 2.3, 2.4 |

---

## Epic 5: Relatórios e Gestão

> Analytics, exportação e comunicação.

| Story | Módulo | FR | MoSCoW | Tamanho | Dep |
|-------|--------|----|--------|---------|-----|
| [5.1](active/5.1.story.md) | Dashboard e Indicadores | FR-22 | MUST | M | Epics 1-3 |
| [5.2](active/5.2.story.md) | Filtro de Busca Avançado | FR-29 | MUST | S | 1.1 |
| [5.3](active/5.3.story.md) | Relatório e Exportação | FR-28 | MUST | M | Epics 1-3 |
| [5.4](active/5.4.story.md) | Histórico de Alterações | FR-27 | MUST | S | 1.1 |
| [5.5](active/5.5.story.md) | Comunicação Interna | FR-24 | SHOULD | M | 1.1 |
| [5.6](active/5.6.story.md) | Relatórios de Produção (Admin) | FR-25 | SHOULD | M | 5.1 |

---

## Resumo

| Epic | Stories | Status |
|------|---------|--------|
| Epic 1 — Prontuário | 5 | Draft |
| Epic 2 — Farmacoterapia | 4 | Draft |
| Epic 3 — Intervenção | 5 | Draft |
| Epic 4 — Assistente/Docs | 2 | Draft |
| Epic 5 — Relatórios | 6 | Draft |
| **Total** | **22 stories** | **Draft** |

---

## Próximo Passo

```
@po *validate-story-draft docs/stories/active/1.1.story.md
```

Validar Story 1.1 com @po (Pax) antes de iniciar implementação com @dev.

---

*Gerado por @pm (Morgan) em 2026-04-03*
*Baseado na spec IDEA-993B9D96 — 29 Functional Requirements*
