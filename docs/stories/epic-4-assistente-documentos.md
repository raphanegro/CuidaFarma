# Epic 4: Assistente Clínico e Documentos

**ID:** EPIC-4
**Status:** Ready
**Prioridade:** P0 — MUST
**Source:** IDEA-993B9D96 / FR-11, FR-13, FR-20, FR-23

## Objetivo

Integrar o assistente clínico inteligente (alertas e sugestões via IA) e o sistema de gerenciamento de documentos anexados (receitas, exames laboratoriais, diários), com limite de 10 páginas por paciente.

## Stories

| Story | Módulo | FR | Status |
|-------|--------|----|--------|
| [4.1](active/4.1.story.md) | Upload e Gestão de Anexos | FR-11, FR-20, FR-23 | Draft |
| [4.2](active/4.2.story.md) | Sugestões do Assistente Clínico | FR-13 | Draft |

## Dependências

- Epic 1 e Epic 2 devem estar em andamento
- Story 4.2 depende de Story 4.1 (para contexto dos documentos)

## Definition of Done do Epic

- [ ] Upload de PDF/imagem funcional com limite de armazenamento
- [ ] Documentos visualizáveis dentro do prontuário
- [ ] Alertas automáticos de interações e doses gerados pela IA
- [ ] Sugestões de intervenção baseadas nos dados clínicos
