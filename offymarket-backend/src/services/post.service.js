import fetch from 'node-fetch';
import config from '../config/index.js';

/**
 * Agrupa los posts por nombre de usuario, cuenta los posts 
 * y calcula las palabras más frecuentes de todos los títulos.
 * @param {Array} posts - Lista de posts recibidos de la API externa.
 * @returns {Array} Un array de objetos con el nombre, conteo y las 5 palabras más frecuentes.
 */

//TODO: Esta lista de stop words traladarla a una DB no relacional para mantenimiento dinamico.
const STOP_WORDS = new Set([
  'a', 'al', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'del', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'según', 'sin', 'so', 'sobre', 'tras',
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras',
  'y', 'e', 'o', 'u', 'ni', 'que', 'pero', 'mas', 'aunque', 'si', 'sino', 'luego', 'pues', 'porque',
  'me', 'te', 'se', 'nos', 'os', 'lo', 'le', 'les', 'me', 'tu', 'él', 'ella', 'ello',
  'es', 'son', 'está', 'están', 'hay', 'ha', 'han', 'fue', 'fueron', 'ser', 'estar', 'haber',
  'todo', 'toda', 'todos', 'todas', 'poco', 'poca', 'pocos', 'pocas', 'mucho', 'mucha', 'muchos', 'muchas', 'algún', 'alguna', 'algunos', 'algunas',
  'como', 'donde', 'cuando', 'que', 'cual', 'cuales', 'quien', 'quienes', 'cuyo', 'cuyas',
]);
const groupAndCountPosts = (posts) => {
  const userCounts = {};
  const wordFrequency = {};
  

  /*
  Recorre el objeto resultado del servicio , 
  agrupa por usuario y cuenta las palabras
  */
  posts.forEach(post => {
    if (post.name && post.name.trim() !== '') {
      const name = post.name;
      userCounts[name] = (userCounts[name] || 0) + 1;
    }
    if (post.comment) {
      const words = post.comment
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Eliminar puntuación
        .split(/\s+/); // Dividir por espacios/saltos

      words.forEach(word => {
        // Ignorar si es un conector o una cadena vacía
        if (word.length > 2 && !STOP_WORDS.has(word)) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    }
  });

  // 3. Obtener las 5 Palabras Más Frecuentes
  const sortedWords = Object.keys(wordFrequency)
    .map(word => ({
      word: word,
      count: wordFrequency[word]
    }))
    .sort((a, b) => b.count - a.count) // Ordenar de mayor a menor
    .slice(0, 5); // Tomar solo las 5 primeras

  return Object.keys(userCounts).map(name => ({
    name: name,
    postCount: userCounts[name],
    topWords: sortedWords 
  }));
};

export const getProcessedPosts = async () => {
    const response = await fetch(config.externalApiUrl);

    if (!response.ok) {
        throw new Error(`Error al consumir API externa. Código de estado: ${response.status}`);
    }

    const data = await response.json();
    
    return groupAndCountPosts(data);
};