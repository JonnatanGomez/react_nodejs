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

  const userAggregates = {};
  
  posts.forEach(post => {
    const name = post.name;

    if (!name || name.trim() === '') return; // Ignorar posts sin nombre

    if (!userAggregates[name]) {
      userAggregates[name] = {
        name: name,
        postCount: 0,
        lastCreatedAt: null, 
        wordFrequency: {},  
      };
    }

    userAggregates[name].postCount += 1;
    
    const currentPostTime = new Date(post.createdAt).getTime();
    if (!userAggregates[name].lastCreatedAt || 
        currentPostTime > new Date(userAggregates[name].lastCreatedAt).getTime()) {
      userAggregates[name].lastCreatedAt = post.createdAt;
    }

    if (post.comment) {
      const words = post.comment
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Eliminar puntuación
        .split(/\s+/) // Dividir por espacios/saltos
        .filter(word => word.length > 2 && !STOP_WORDS.has(word)); // Filtrar palabras vacías y stop words

      words.forEach(word => {
        const localFreq = userAggregates[name].wordFrequency;
        localFreq[word] = (localFreq[word] || 0) + 1;
      });
    }
  });

  /*
    Calcular el Top 5 para cada usuario.
  */
  return Object.values(userAggregates).map(userGroup => {
    const sortedWords = Object.keys(userGroup.wordFrequency)
      .map(word => ({
        word: word,
        count: userGroup.wordFrequency[word]
      }))
      .sort((a, b) => b.count - a.count) // Ordenar de mayor a menor
      .slice(0, 5); // Tomar solo las 5 primeras (Top 5)

    // 2b. Devolver el resultado con la estructura solicitada
    return {
      createdAt: userGroup.lastCreatedAt,
      name: userGroup.name,
      postCount: userGroup.postCount,
      topWords: sortedWords,
    };
  });
};

export const getProcessedPosts = async () => {
    const response = await fetch(config.externalApiUrl);

    if (!response.ok) {
        throw new Error(`Error al consumir API externa. Código de estado: ${response.status}`);
    }

    const data = await response.json();

    return groupAndCountPosts(data);
};