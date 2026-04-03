# Epic 2: Farmacoterapia

**ID:** EPIC-2
**Status:** Ready
**Prioridade:** P0 — MUST
**Source:** IDEA-993B9D96 / FR-7, FR-8, FR-9, FR-12, FR-21

## Objetivo

Registrar e analisar a terapia medicamentosa do paciente: resultados de exames laboratoriais, medicamentos em uso (diferente do catálogo), análise farmacoterapêutica completa e registro de Problemas Relacionados a Medicamentos (PRM/PRF).

## Contexto

Já existem: catálogo de medicamentos (`/api/medicamentos`) e análises básicas com Claude AI (`/api/analises`). Este epic cria o módulo de "medicamentos em uso por paciente" (distinto do catálogo) e a análise farmacoterapêutica clínica completa.

## Stories

| Story | Módulo | FR | Status |
|-------|--------|----|--------|
| [2.1](active/2.1.story.md) | Resultados de Exames Laboratoriais | FR-7 | Draft |
| [2.2](active/2.2.story.md) | Medicamentos em Uso | FR-8 | Draft |
| [2.3](active/2.3.story.md) | Análise Farmacoterapêutica Completa | FR-9 | Draft |
| [2.4](active/2.4.story.md) | Registro de PRM/PRF | FR-12, FR-21 | Draft |

## Dependências

- Epic 1 completo (especialmente Stories 1.1, 1.2)

## Definition of Done do Epic

- [ ] Medicamentos em uso registrados por paciente/atendimento
- [ ] Exames laboratoriais registrados com valores de referência
- [ ] Análise farmacoterapêutica cobre interações, duplicidade, dose
- [ ] PRMs classificados e registrados
- [ ] Integração com Claude AI para sugestões
