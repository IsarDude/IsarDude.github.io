# Portfolio

Persönliches Portfolio mit [Astro](https://astro.build), Markdown-basierten
Projekten und Blog-Beiträgen. Deployed automatisch über GitHub Actions auf
GitHub Pages.

🔗 Live: https://IsarDude.github.io/portfolio/

## Projektstruktur

```text
/
├── public/                     # statische Assets (Favicon etc.)
├── src/
│   ├── components/              # Header, Footer
│   ├── content/
│   │   ├── projects/*.md        # Projekte (Markdown mit Frontmatter)
│   │   └── blog/*.md            # Blogbeiträge (Markdown mit Frontmatter)
│   ├── content.config.ts        # Schema für die Content Collections
│   ├── layouts/BaseLayout.astro
│   ├── pages/                   # Routen (Start, Projekte, Blog, Über mich)
│   └── styles/global.css
└── .github/workflows/deploy.yml # Build & Deploy nach GitHub Pages
```

## Neuen Inhalt hinzufügen

**Neues Projekt:** Datei unter `src/content/projects/mein-projekt.md` anlegen:

```md
---
title: "Mein Projekt"
description: "Kurzbeschreibung"
pubDate: 2026-02-01
tags: ["Astro"]
link: "https://example.com"
repo: "https://github.com/IsarDude/mein-projekt"
---

Inhalt in Markdown...
```

**Neuer Blogpost:** Datei unter `src/content/blog/mein-post.md` mit `title`,
`description`, `pubDate` und optional `tags` im Frontmatter anlegen.

## Befehle

| Befehl              | Aktion                                      |
| :------------------- | :------------------------------------------- |
| `npm install`         | Installiert Abhängigkeiten                    |
| `npm run dev`         | Startet lokalen Dev-Server auf `localhost:4321` |
| `npm run build`       | Baut die Seite nach `./dist/`                |
| `npm run preview`     | Baut und zeigt die Seite lokal an            |

## Deployment

Jeder Push auf `main` löst automatisch `.github/workflows/deploy.yml` aus,
das die Seite baut und nach GitHub Pages deployed. Damit das funktioniert,
muss im Repo unter **Settings → Pages → Build and deployment → Source** die
Option **GitHub Actions** ausgewählt sein.

Die `site`- und `base`-Werte in `astro.config.mjs` sind auf
`https://IsarDude.github.io` und `/portfolio` eingestellt (Project Page).
Falls das Repo stattdessen `IsarDude.github.io` heißt, `base` entfernen.
