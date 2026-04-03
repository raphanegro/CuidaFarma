# Epic 1: Prontuário Farmacêutico

**ID:** EPIC-1
**Status:** Done
**Prioridade:** P0 — MUST
**Source:** IDEA-993B9D96 / FR-2, FR-3, FR-4, FR-5, FR-6

## Objetivo

Construir o núcleo do prontuário farmacêutico clínico: registro completo do paciente, tipo de atendimento, motivo da consulta, histórico clínico e dados clínicos mensuráveis. Esta é a base sobre a qual todos os outros módulos dependem.

## Contexto

O projeto já possui um cadastro básico de paciente (nome, CPF, email). Este epic expande esse cadastro para o padrão clínico completo e adiciona os módulos de atendimento que formam o prontuário.

## Stories

| Story | Módulo | FR | Status |
|-------|--------|----|--------|
| [1.1](active/1.1.story.md) | Melhorar Cadastro de Paciente | FR-2 | Done |
| [1.2](active/1.2.story.md) | Módulo Tipo de Atendimento | FR-3 | Done |
| [1.3](active/1.3.story.md) | Módulo Motivo da Consulta | FR-4 | Done |
| [1.4](active/1.4.story.md) | Módulo Histórico Clínico | FR-5 | Done |
| [1.5](active/1.5.story.md) | Módulo Dados Clínicos | FR-6 | Done |

## Dependências

- Story 1.1 deve ser concluída antes de 1.2, 1.3, 1.4, 1.5
- Epic 1 deve ser concluído antes de Epics 2, 3 e 4

## Definition of Done do Epic

- [ ] Prontuário completo acessível por paciente
- [ ] Dados clínicos registrados e visualizados
- [ ] Schema Prisma atualizado e migrado
- [ ] UI responsiva integrada ao dashboard existente
- [ ] Todos os testes passando
