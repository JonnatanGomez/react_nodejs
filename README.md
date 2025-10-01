🚀 OffyMarket Stack (Frontend & Backend)
Este repositorio contiene la configuración de un sistema distribuido simple, compuesto por un Backend (Node.js/Express) que simula una API de datos y un Frontend (React/Vite/TailwindCSS) para visualizar y filtrar esa información.
Todo el stack está configurado para ser ejecutado y gestionado mediante Docker y Docker Compose.
Prerrequisitos
Asegúrate de tener instalado en tu sistema:
Docker Desktop (o Docker Engine)
Docker Compose (generalmente viene incluido con Docker Desktop)
1. Estructura del Proyecto
El proyecto sigue esta estructura de directorios:
.
├── offymarket-backend/
│   ├── Dockerfile
│   ├── package.json (Contiene el script "start")
│   └── src/app.js (Archivo principal de la API)
├── offymarket-frontend/
│   ├── Dockerfile
│   └── src/App.tsx (Contiene la lógica de conexión a la API)
└── docker-compose.yml (Archivo maestro para la orquestación)


2. Ejecución con Docker Compose (Método Recomendado)
Este método es el más sencillo, ya que el archivo docker-compose.yml gestiona la construcción de ambas imágenes, la creación de la red interna y la inyección de variables de entorno.
A. Construir y Levantar los Servicios
Ejecuta este comando desde la raíz del proyecto para construir las imágenes y levantar ambos contenedores en segundo plano (-d):
docker compose up --build -d


Puerto / Host
Servicio
Propósito
http://localhost:8080
Frontend (Nginx)
Acceso a la aplicación web (React).
http://localhost:3001
Backend (Node.js)
Acceso directo a la API (Opcional).

B. Ver los Logs
Para ver los logs de ambos servicios en tiempo real (útil para verificar errores):
docker compose logs -f


C. Detener y Limpiar
Para detener y eliminar todos los contenedores, la red y los volúmenes creados por docker compose:
docker compose down


3. Construcción y Ejecución Individual de Imágenes
Si deseas construir y ejecutar cada servicio por separado, sigue estos pasos:
A. Construir Imágenes Individuales
Ejecuta el comando docker build en el directorio de cada servicio:
# 1. Construir el Backend
docker build -t offymarket-backend-app ./offymarket-backend

# 2. Construir el Frontend
docker build -t offymarket-frontend-app ./offymarket-frontend


B.. Ejecutar Servicios Individuales
Ejecuta cada contenedor, conectándolos a la red y exponiendo sus puertos.
# 1. Ejecutar el Backend (debe recibir la variable de entorno)
docker run -d --name backend-service \
  -p 3001:3001 \
  --network offymarket-network \
  -e EXTERNAL_API_URL="[https://jsonplaceholder.typicode.com/posts](https://jsonplaceholder.typicode.com/posts)" \
  offymarket-backend-app

# 2. Ejecutar el Frontend
# El Frontend debe usar la URL http://localhost:3001/posts internamente
docker run -d --name frontend-web \
  -p 8080:80 \
  --network offymarket-network \
  offymarket-frontend-app


4. Correr Pruebas desde Contenedores (Asumiendo Scripts de Prueba)
Si tu proyecto Node.js tiene un script de prueba definido en package.json (por ejemplo, "test": "jest"), puedes ejecutar las pruebas dentro de un contenedor sin necesidad de iniciar los servicios completos.
A. Pruebas del Backend
Usando la imagen previamente construida (offymarket-backend-app):
docker run --rm offymarket-backend-app npm test


--rm asegura que el contenedor sea eliminado inmediatamente después de que las pruebas terminen.
B. Pruebas del Frontend
Usando la imagen previamente construida (offymarket-frontend-app):
docker run --rm offymarket-frontend-app npm test