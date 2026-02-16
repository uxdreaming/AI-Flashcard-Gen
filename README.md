# AI Flashcard Generator

Generador inteligente de flashcards optimizadas para spaced repetition a partir de documentos PDF/texto.

## Idea

Subís un PDF (apuntes, papers, documentación) y el sistema:
1. Extrae los conceptos clave del documento
2. Genera pares pregunta/respuesta como flashcards
3. Optimiza las flashcards para retención usando principios de spaced repetition
4. Exporta en formatos compatibles con Anki u otras apps

## Stack propuesto

- **Python** - Backend y procesamiento
- **OpenAI API / Claude API** - Generación y análisis de contenido
- **PyPDF2 / pdfplumber** - Extracción de texto de PDFs
- **Streamlit** - UI rápida para demo
- **JSON/CSV** - Exportación de flashcards

## Roadmap

### Fase 1 - MVP (Sesión 1)
- [ ] Extracción de texto desde PDF
- [ ] Prompt engineering para generar flashcards desde texto
- [ ] Output básico en JSON/CSV
- [ ] Script funcional end-to-end

### Fase 2 - UI & Mejoras
- [ ] Interfaz con Streamlit para subir archivos
- [ ] Selector de dificultad y cantidad de flashcards
- [ ] Preview de flashcards antes de exportar
- [ ] Exportación formato Anki (.apkg)

### Fase 3 - Inteligencia
- [ ] Detección automática de temas y subtemas
- [ ] Generación de flashcards con contexto visual (diagramas, tablas)
- [ ] Modo "examen" que genera preguntas de opción múltiple
- [ ] Análisis de dificultad por concepto

## Estructura

```
AI-Flashcard-Generator/
├── src/           # Código fuente
├── data/          # PDFs de prueba y outputs generados
├── docs/          # Documentación del proyecto
└── README.md
```

## Proyecto para

Formación **AI for UXers** - Febrero 2026
