import * as postService from '../services/post.service.js';

export const getPosts = async (req, res) => {

    const filterName = req.query.name ? req.query.name.toLowerCase() : null;

    try {
        let posts = await postService.getProcessedPosts();
        if (filterName) {
            posts = posts.filter(post => 
                post.name.toLowerCase().includes(filterName)
            );
        }
        res.json(posts);
    } catch (error) {
        console.error('Error en getPosts controller:', error.message);
        // Requisito de la prueba: Devuelve un error 500 si la API externa falla.
        res.status(500).json({ error: 'Error interno del servidor al procesar los posts.' });
    }
};