import fetch from 'node-fetch'; 

if (!process.env.EXTERNAL_API_URL) {
    // Solo funcionará si el archivo .env se copia al contenedor, si no habra que enviarle la variable en la ejecucion    
    const dotenv = await import('dotenv');
    dotenv.config();
}

const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL;

describe('Pruebas de Conectividad de la API Externa', () => {

    // Prueba simple
    test('La configuración básica de Jest es correcta (1 + 1 = 2)', () => {
        expect(1 + 1).toBe(2);
    });

    // Verifica que el servicio externo responda con un código 200 (OK).
    test('La API externa debe responder con un código de estado 200 (OK)', async () => {
        if (!EXTERNAL_API_URL) {
            throw new Error("La variable de entorno EXTERNAL_API_URL no está definida después de la carga. La prueba no puede continuar.");
        }

        console.log(`Intentando conectar con: ${EXTERNAL_API_URL}`);

        try {
            const response = await fetch(EXTERNAL_API_URL, { timeout: 5000 });

            if (!response.ok) {
                throw new Error(`Fallo del servicio externo. Código: ${response.status}.`);
            }
            expect(response.status).toBe(200);

        } catch (error) {
            console.error("Error durante la prueba de conectividad:", error);
            throw new Error(`Fallo de conexión o HTTP: ${error.message}`);
        }
    }, 10000);
});
