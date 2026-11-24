# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MailMinter generates AI email replies via Google Gemini. It is a single Maven project at the repo root:

- `src/`: Spring Boot 3.5 (Java 17) backend. It is the only component that calls Gemini.
- `frontend/`: React 19, Vite and MUI web UI. It is built by Maven (`frontend-maven-plugin`) and served by Spring Boot from the same jar.
- `extension/`: a Chrome Manifest V3 extension that injects an "AI Reply" button into Gmail. It is not part of the Maven build and is loaded unpacked into Chrome.

## Commands

Run these from the repo root (use `mvnw.cmd` on Windows):
```
./mvnw spring-boot:run                    # builds UI + runs on :8080 (UI at /, API at /api)
./mvnw spring-boot:run -DskipFrontend     # backend only, skips the npm build
./mvnw clean package                      # -> target/mail-minter-0.0.1-SNAPSHOT.jar (includes UI)
./mvnw test
./mvnw test -Dtest=EmailWriterApplicationTests   # single test class (append #method for one method)
docker build -t mail-minter . && docker run -p 8080:8080 --env-file .env mail-minter
```

Frontend dev loop (from `frontend/`): `npm run dev` (the Vite proxy forwards `/api` to `localhost:8080`) and `npm run lint`. There are no frontend tests.

## Build wiring

- `frontend-maven-plugin` installs Node into `target/` and runs `npm ci` and `npm run build` during `generate-resources`. `frontend/vite.config.js` sets `build.outDir` to `../target/classes/static`, so Spring Boot serves the built UI as static content. Because of this, `mvn clean` also wipes the UI build.
- When `frontend/package.json` changes, `frontend/package-lock.json` must stay in sync, or `npm ci` fails the Maven build.

## Configuration

- Secrets live in the root `.env` (git-ignored; template in `.env.example`). Spring loads it through `spring.config.import=optional:file:.env[.properties]`, and real environment variables override it. `.dockerignore` excludes `.env`, so Docker gets secrets through `--env-file`.
- `GEMINI_API_KEY` is required. `GEMINI_API_URL` defaults to the `gemini-2.0-flash` `generateContent` endpoint. The service builds the URI as `geminiApiUrl + geminiApiKey` by plain string concatenation, so a custom URL must end with `?key=`.
- The UI calls the API with a relative URL (`VITE_API_URL` is optional and defaults to the same origin).
- The extension hardcodes `http://localhost:8080` in both `extension/content.js` and `manifest.json` `host_permissions`. Change both together.

## Architecture

API contract shared by the UI and the extension: `POST /api/email/generate` with JSON `{ "emailContent": string, "tone": string }`. It returns the reply as **plain text** (not JSON). CORS is open to all origins so the Gmail extension can call it.

Backend flow (`com.email.writer.app`): `EmailGeneratorController` calls `EmailGeneratorService.generateEmailReply`. That method builds a text prompt (`buildPrompt`; tone is optional), POSTs it in Gemini's `generateContent` format through a blocking `WebClient`, and extracts `candidates[0].content.parts[0].text`. If parsing fails, the endpoint returns a 200 whose body is an `"Error processing response: ..."` string rather than an HTTP error.

Extension (`content.js`): a `MutationObserver` watches Gmail's DOM for a compose toolbar and injects the button. The button scrapes the last message body in the thread, calls the backend with the tone fixed to `professional`, and appends the reply to the compose box. It depends on Gmail's obfuscated CSS class selectors (`.btC`, `.aDh`, `.a3s.aiL`, `.Am`, etc.), which are the most likely thing to break when Gmail changes.
