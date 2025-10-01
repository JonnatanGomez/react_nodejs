import 'dotenv/config'; 

const config = {
    port: process.env.PORT || 3001,
    externalApiUrl: process.env.EXTERNAL_API_URL,
};

// Validación de la variable crítica
if (!config.externalApiUrl) {
    console.error("ERROR: La variable de entorno EXTERNAL_API_URL no está definida.");
    process.exit(1);
}

export default config;