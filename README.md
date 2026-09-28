# Portfolio

Portfolio von Lukas Fritsch (Gameplay & Systems Programmer), gebaut mit dem
[Astro Sphere](https://github.com/markhorn-dev/astro-sphere) Theme. Deployed
automatisch über GitHub Actions auf GitHub Pages.

🔗 Live: https://IsarDude.github.io/

## Projektstruktur

```text
/
├── public/
│   └── images/projects/        # Titelbilder für Projekte
├── src/
│   ├── components/              # Header, Footer, ArrowCard (Listen-Karten), ...
│   ├── content/
│   │   ├── projects/<slug>/index.md   # Projekte (Case Studies)
│   │   ├── blog/<slug>/index.md       # Blogbeiträge
│   │   └── work/<company>.md          # Berufserfahrung
│   ├── content/config.ts        # Schema für die Content Collections
│   ├── consts.ts                # Seitentitel, Navigation, Social Links
│   └── pages/
└── .github/workflows/deploy.yml # Build & Deploy nach GitHub Pages
```

## Neues Projekt mit Titelbild hinzufügen

1. Bild nach `public/images/projects/mein-projekt.png` (oder `.svg`/`.jpg`) legen.
2. Ordner `src/content/projects/mein-projekt/index.md` anlegen:

```md
---
title: "Mein Projekt"
summary: "Kurzbeschreibung, erscheint in der Projektliste"
date: "2026-06-01"
tags: ["Unity", "C#"]
image: "/images/projects/mein-projekt.png"
demoUrl: "https://example.com"
repoUrl: "https://github.com/IsarDude/mein-projekt"
---

## Header Snapshot
...

## Systems Architected
...

## Engineering Challenge
...

## Code & Artifacts
...
```

Das `image`-Feld ist optional — ohne Bild wird die Karte wie gehabt ohne
Thumbnail angezeigt. Es wird in der Projekt-Übersicht (`/projects`) und der
Startseite als kleines Vorschaubild links neben dem Titel gerendert
(`src/components/ArrowCard.tsx`).

## Neuer Blogpost

Ordner `src/content/blog/mein-post/index.md` mit `title`, `summary`, `date`
und `tags` im Frontmatter anlegen.

## Befehle

| Befehl          | Aktion                                          |
| :--------------- | :------------------------------------------------ |
| `npm install`     | Installiert Abhängigkeiten                        |
| `npm run dev`     | Startet lokalen Dev-Server auf `localhost:4321`   |
| `npm run build`   | Type-Check + Build nach `./dist/`                 |
| `npm run preview` | Baut und zeigt die Seite lokal an                 |

## Deployment

Jeder Push auf `main` löst automatisch `.github/workflows/deploy.yml` aus,
das die Seite baut und nach GitHub Pages deployed (Source: **GitHub Actions**
unter Settings → Pages).

Das Repo heißt `IsarDude.github.io` (User-Page), daher braucht
`astro.config.mjs` **keinen** `base`-Pfad — die Seite läuft direkt unter
`https://IsarDude.github.io/`.
