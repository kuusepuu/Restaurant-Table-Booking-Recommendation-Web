# Restaurant Table Booking & Recommendation Web App

A full-stack web application that lets restaurant visitors browse a visual floor plan, filter available tables, receive scored recommendations, and book a table — all in one place.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [How to Run](#how-to-run)
4. [How to Use the App](#how-to-use-the-app)
5. [Design Decisions](#design-decisions)
6. [Assumptions Made](#assumptions-made)
7. [What Was Done & How](#what-was-done--how)
8. [Time Spent](#time-spent)
9. [What Was Difficult](#what-was-difficult)
10. [Problems & Solutions](#problems--solutions)
11. [Unresolved Issues](#unresolved-issues)
12. [AI Usage](#ai-usage)

---

## Tech Stack

| Layer     | Technology                                                                                  |
|-----------|---------------------------------------------------------------------------------------------|
| Frontend  | **Angular 21** (standalone components, signals, reactive forms, RxJS, Angular Router)       |
| Backend   | **Spring Boot 4.0.3** · Java 25 · Spring Data JPA · Spring Validation · Spring Web MVC     |
| Database  | **SQLite** (file-based, zero-install) via `sqlite-jdbc` + Hibernate Community Dialects      |
| Build     | Maven (backend) · npm / Angular CLI (frontend)                                              |
| Utilities | Lombok (boilerplate reduction) · Prettier (frontend formatting)                             |
| Testing   | JUnit 5 / Spring Boot Test (backend)          |

---

## Project Structure

```
.
├── backend/               # Spring Boot application
│   ├── src/main/java/com/restaurant/backend/
│   │   ├── config/        # CORS config, data seeder (random bookings on startup)
│   │   ├── controller/    # REST endpoints: /api/tables, /api/bookings
│   │   ├── dto/           # Request/response records (BookingRequest, SearchCriteria, …)
│   │   ├── Entity/        # JPA entities: RestaurantTable, Booking + Zone enum
│   │   ├── repository/    # Spring Data JPA repositories
│   │   └── service/       # BookingService, TableService, RecommendationService
│   └── src/main/resources/
│       └── application.yml
├── frontend/              # Angular SPA
│   └── src/app/
│       ├── components/
│       │   ├── booking-search/   # Filter form (date, time, group size, zone, accessibility)
│       │   ├── floor-plan/       # SVG floor plan with zone backgrounds
│       │   ├── table-detail/     # Booking confirmation panel
│       │   └── booking-list/     # List of today's bookings with cancel action
│       ├── models/               # TypeScript interfaces (RestaurantTable, Booking, …)
│       └── services/             # HTTP services wrapping the backend API
└── restaurant.db          # SQLite database file (auto-created on first run)
```

---

## How to Run

### Prerequisites

| Tool        | Required version |
|-------------|-----------------|
| Java JDK    | 25              |
| Maven       | 3.9+            |
| Node.js     | 20+             |
| npm         | 11+             |

Copy the repository and navigate to the project root:

```bash
git clone https://github.com/kuusepuu/Restaurant-Table-Booking-Recommendation-Web.git
cd Restaurant-Table-Booking-Recommendation-Web
````

### 1 — Start the backend (1 terminal)

```bash
cd backend
./mvnw spring-boot:run
```

The API starts on **http://localhost:8080**.  
On first startup the database is seeded automatically: 17 tables are created and random bookings are scattered across today's and tomorrow's schedules.

> **Windows users:** use `.\mvnw.cmd spring-boot:run`

### 2 — Start the frontend (2-nd terminal)

```bash
cd frontend
npm install
npm start
```

The Angular dev server starts on **http://localhost:4200** and proxies all `/api/**` calls to the backend (configured in `proxy.conf.json`).

Open **http://localhost:4200** in your browser. That's it.

---

## How to Use the App

1. **Search panel (left sidebar)**
   - Pick a **date** and **start time** (30-minute slots, 11:00–22:00).
   - Choose a **duration** (1h, 1.5h, 2h, 2.5h, or 3h; defaults to 2h).
   - Set the **group size** (1–20 people).
   - Optionally tick one or more **zone preferences**: Main Hall, Window, Private, Patio.
   - Tick **wheelchair accessible** if needed.
   - Click **Find Tables**.

2. **Floor plan (centre)**
   - The SVG floor plan shows all tables colour-coded by zone.
   - **Golden** tables have scored recommendations for your criteria.
   - **Red** tables are already booked for that slot.
   - **Grey / muted** tables are too small for your group.
   - Click a table to select it.

3. **Booking panel (right sidebar)**
   - Confirm your name and submit the booking.
   - The floor plan updates immediately — your table turns red.

4. **Bookings list (bottom)**
   - Shows all bookings for the selected date.
   - Each booking can be cancelled, which frees the table again.
   - Currently shows all bookings for the day; in a real app a user would only see their own bookings, but implementing user accounts was out of scope for this project.

---

## Design Decisions

### 2 JPA entities (`RestaurantTable` and `Booking`)

Intentionally minimal. The task requires tables with zones, capacities and positions, and the ability to book them — both of which map directly to these two entities. Adding separate `Customer`, `TimeSlot`, or `Zone` entity tables would introduce joins and complexity without adding any visible functionality. Since this is my first Spring Boot project, keeping the model lean made it much easier to understand JPA relationships, lazy/eager fetching, and cascade behaviour without getting lost in over-engineering.

### SQLite instead of H2 or PostgreSQL

SQLite is a single file (`restaurant.db`) that requires zero installation, zero configuration, and zero running process. Anybody can clone the repo, run two commands, and the app is live — no database setup wizard. H2 in-memory mode would lose seeded data on every restart; H2 file mode is similar but less universal. PostgreSQL or MySQL would require a separate server and credentials. For a demo, SQLite is the cleanest choice.

### Plain CSS instead of Tailwind or a component library

Tailwind would be a good choice for a larger team or long-lived project, but it adds a build-time dependency, requires learning utility class semantics, and produces verbose HTML that is hard to read at a glance. Angular Material / PrimeNG would solve styling quickly but ship hundreds of kilobytes of JavaScript for a UI that is fundamentally a form + an SVG. For a solo project of this size, vanilla CSS in scoped component stylesheets is more transparent — every rule has an obvious reason and there is no fighting against a component library's opinionated layout system.

### Angular standalone components (no NgModules)

Angular 17+ recommends standalone components as the default. They are simpler to reason about (each component declares its own imports) and require less boilerplate. Since this project started fresh, there was no reason to use the legacy module pattern.

### Every available table receives a score, not just the top pick

The recommendation endpoint scores and returns **all** eligible tables, not only the best match. Each table gets a 0–100 score based on four criteria: capacity fit (40 pts), zone preference (30 pts), accessibility (20 pts), and low utilisation (10 pts). The floor plan then highlights every recommended table in gold with its score visible on hover, so users can compare options at a glance and make their own choice rather than being funnelled toward a single suggestion. This also means the full ranked list is available if the front-end wants to surface it in a different way later.

### Can book tables for up to 3h starting at 22:00

The booking system allows 3-hour reservations starting at any 30-minute slot between 11:00 and 22:00. This means a user could book a table from 22:00 to 01:00, which is technically outside of normal restaurant hours but was not explicitly forbidden in the task description. Allowing late-night bookings adds flexibility for users who want to reserve a table for a special occasion that extends past midnight. The backend handles time overlap correctly regardless of whether the end time goes into the next day.

---

## Assumptions Made

The following points were ambiguous in the task description and resolved with these assumptions:

| Ambiguity | Assumption made |
|-----------|----------------|
| User identity — the task mentions "visitor" but no login/account system. | A simple **name text field** per booking is used; no authentication. |
| "Floor plan can be a simple grid" | Implemented as an **SVG grid** with zone background rectangles drawn around table clusters. |
| Number of tables and layout | Designed a 17-table layout across 4 zones; positions stored as grid coordinates in the database. |
| "Randomly generated bookings" | Random bookings are seeded once at first startup for the current day and the following day. |

---

## What Was Done & How

### Backend

1. **Domain model** — `RestaurantTable` (id, label, capacity, zone, accessible, gridX, gridY) and `Booking` (id, table FK, customerName, groupSize, date, startTime, endTime). `Zone` is a string-backed enum (`MAIN_HALL`, `WINDOW`, `PRIVATE`, `PATIO`). Both entities live in the `Entity` package.
2. **Repositories** — Spring Data JPA interfaces; `BookingRepository` has a custom JPQL query for overlap detection.
3. **Services** — `TableService` (availability filtering), `BookingService` (create / list / cancel), `RecommendationService` (scoring).
4. **REST API** — Two controllers, seven endpoints total:
   - `GET  /api/tables` — all tables (for floor plan)
   - `GET  /api/tables/{id}` — single table details
   - `GET  /api/tables/available?date&start&end&groupSize` — availability filter
   - `GET  /api/bookings?date` — bookings for a day
   - `POST /api/bookings` — create booking
   - `DELETE /api/bookings/{id}` — cancel booking
   - `POST /api/bookings/recommend` — scored recommendations
5. **Data seeder** — seeds 17 tables and random bookings for today and tomorrow on first run.
6. **CORS** — `CorsConfig` allows `http://localhost:4200` for local development.

### Frontend

1. **BookingSearchComponent** — reactive form with date, time (drop-down of 30-min slots), duration (1h–3h), group size, zone checkboxes, and accessibility toggle.
2. **FloorPlanComponent** — renders an SVG. Zone backgrounds are computed from table coordinates; tables are drawn as coloured rectangles with status classes (occupied / recommended / too-small). Emits a `tableSelected` event.
3. **TableDetailComponent** — displays selected table info, a name input, and a submit button.
4. **BookingListComponent** — shows bookings for the selected date, supports cancellation.
5. **Services** — `TableService`, `BookingService`, `RecommendationService` wrap the HTTP API using Angular's `HttpClient` and return `Observable`s.
6. **State management** — the root `AppComponent` uses Angular Signals (`signal<>()`) to manage reactive state (tables, bookings, recommendations, selected table) without a dedicated state library.
7. **Routing** — single route (`/`) renders all components on one page; no navigation needed.

---

## Time Spent

| Phase                                                           | Time          |
|-----------------------------------------------------------------|---------------|
| Planning and architecture (before writing code)                 | *not counted* |
| Backend (entities, repositories, services, controllers, seeder) | ~3.5 h        |
| Frontend (components, services, SVG floor plan, styling)        | ~4 h          |
| Integration, debugging, and polish                              | ~1.5 h        |
| README                                                          | ~1 h          |
| **Total (coding)**                                              | **~10 hours** |

---

## What Was Difficult

- **SVG floor plan layout** — computing zone background rectangles from a grid of table coordinates required tracking which columns belonged to each zone and inserting gaps between zone bands. This took the most iteration of any single feature.
- **Angular reactive forms with checkbox groups** — mapping a `FormGroup` of boolean checkboxes back to a `string[]` of selected zone names was more verbose than expected and required a custom mapping step in the submit handler.
- **First time with Spring Boot** — understanding the JPA entity lifecycle, knowing when `@Transactional` is needed, and getting auto-configuration (data source, dialect, DDL mode) correct took time.
- **First time with Angular** — understanding the difference between `Observable` and `Promise`, when to use `async` pipe vs `.subscribe()`, and the standalone component import model required reading documentation carefully.

---

## Problems & Solutions

| Problem | Where I got help              | Solution |
|---------|-------------------------------|----------|
| SQLite dialect not found in Spring Boot 4 / Hibernate 7 | AI + Hibernate docs           | Added `hibernate-community-dialects` dependency; used `org.hibernate.community.dialect.SQLiteDialect` |
| Spring Boot 4 artifact name changed (`spring-boot-starter-web` → `spring-boot-starter-webmvc`) | Spring Boot 4 migration guide | Updated `pom.xml` to use `spring-boot-starter-webmvc` |
| CORS preflight requests failing in Angular dev | Angular proxy docs            | Added `proxy.conf.json` and `CorsConfig.java` with `@CrossOrigin` equivalent |
| Zone rectangle sizing in SVG | Manual debugging + AI         | Computed bounding box per zone from table grid positions; added configurable `zonePad` and `zoneLabelHeight` offsets |
| Seeded bookings reappearing on every restart | AI                            | Added `if (tableRepository.count() == 0)` guard in `DataSeeder` |

---

## Unresolved Issues

- **No user authentication** — bookings are identified only by a customer name string. In a production system this would be replaced with a proper user account / session.
- **No pagination** — the booking list and table list endpoints return all records. For a real restaurant with years of data, pagination (`Page<T>`) would be necessary.
- **Accessibility score is binary** — a table either is or is not accessible. A richer model could score partially accessible tables (e.g., nearby but not ideal) by encoding multiple accessibility attributes.

---

## AI Usage

- Code sections where AI was heavily used are marked with `// NOTE: AI` comments.
- Used AI to template out HTML and CSS files, then manually edited them.
- Used AI to add comments to the codebase.
- Used AI to help speed up figuring out some logic (e.g., the zone rectangle sizing in the SVG floor plan) by describing the problem and asking for a code snippet to solve it, then adapted the snippet to fit the codebase.
- Used AI for md file templating and formating.
