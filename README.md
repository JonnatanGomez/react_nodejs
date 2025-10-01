# 🚀 OffyMarket Stack (Frontend & Backend)

Sistema mínimo distribuido con:
- **Backend:** Node.js + Express (API simulada de datos)
- **Frontend:** React + Vite + TailwindCSS (UI con filtros)
- Orquestado con **Docker** y **Docker Compose** 🐳

---

## ✨ Resumen Rápido
- `docker compose up --build -d` ➜ levanta **todo**.
- Frontend: http://localhost:8080  
- Backend:  http://localhost:3001 (opcional, acceso directo a API)
- Logs: `docker compose logs -f`  
- Apagar/Limpiar: `docker compose down`

---

## 📦 Prerrequisitos
- Docker Desktop / Docker Engine  
- Docker Compose (incluido en Docker Desktop)

---

## 🗂️ Estructura del Proyecto
```

.
├─ offymarket-backend/
│  ├─ Dockerfile
│  ├─ package.json      # incluye script "start"
│  └─ src/app.js        # API principal
├─ offymarket-frontend/
│  ├─ Dockerfile
│  └─ src/App.tsx       # lógica de conexión a la API
└─ docker-compose.yml   # orquestación de servicios

````

---

## ▶️ Ejecución con Docker Compose (recomendado)
El `docker-compose.yml` construye imágenes, crea la red y maneja variables de entorno.

### A) Construir y levantar
```bash
docker compose up --build -d
````

### 🌐 Puertos

| Servicio | URL/Host                                       | Propósito                          |
| -------- | ---------------------------------------------- | ---------------------------------- |
| Frontend | [http://localhost:8080](http://localhost:8080) | Acceso a la app (React)            |
| Backend  | [http://localhost:3001](http://localhost:3001) | Acceso directo a la API (opcional) |

### B) Ver logs (seguimiento en tiempo real)

```bash
docker compose logs -f
```

### C) Detener y limpiar

```bash
docker compose down
```

---

## 🧩 Construcción y ejecución **individual**

Si prefieres manejar cada servicio por separado:

### A) Construir imágenes

```bash
# 1) Backend
docker build -t offymarket-backend-app ./offymarket-backend

# 2) Frontend
docker build -t offymarket-frontend-app ./offymarket-frontend
```

> 💡 Si vas a correr contenedores sueltos, crea primero una red común:

```bash
docker network create offymarket-network
```

### B) Ejecutar contenedores

```bash
# 1) Backend (requiere EXTERNAL_API_URL)
docker run -d --name backend-service \
  -p 3001:3001 \
  --network offymarket-network \
  -e EXTERNAL_API_URL="https://687eade4efe65e5200875629.mockapi.io/api/v1/posts" \
  offymarket-backend-app

# 2) Frontend (consume http://localhost:3001/posts)
docker run -d --name frontend-web \
  -p 8080:80 \
  --network offymarket-network \
  offymarket-frontend-app
```

---

## 🧪 Correr pruebas en contenedores*

```bash
# Backend
docker build -t offymarket-backend-app --no-cache .
docker run --rm offymarket-backend-app npm test

# Frontend
docker build -t offymarket-frontend-test --target builder . 
docker run --rm -it offymarket-frontend-test npm run test:ci 
```

> `--rm` elimina el contenedor automáticamente al terminar ✅

---

## ❓Tips & Notas

* Compose ya crea una red interna automáticamente; **no** necesitas `docker network create` cuando usas `docker compose`.
* Verifica variables de entorno en el backend (p. ej. `EXTERNAL_API_URL`) según tu fuente de datos.
* Si actualizas código, vuelve a construir con `--build`.

---

## 🧾 Licencia

MIT — usa, modifica y comparte libremente.