import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import { getPosts } from './controllers/posts.controller.js';

const app = express();
app.use(cors()); // Habilitar CORS para el frontend
app.use(express.json()); 

// EndPoins
app.get('/posts', getPosts);

// Ruta de estado
app.get('/', (req, res) => {
    res.json({ 
        status: 'Offymarket Backend API OK', 
        message: 'Accede a /posts para obtener los datos procesados.' 
    });
});

// Iniciar el servidor
app.listen(config.port, () => {
  console.log(`API Express escuchando en http://localhost:${config.port}`);
});