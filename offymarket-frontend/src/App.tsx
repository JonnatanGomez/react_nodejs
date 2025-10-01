import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { type PostCount } from './models/types';
import PostTable from './components/table';

const API_URL =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) || '/api/posts';

/**
 * Hook sencillo para devolver un valor despues de delay
 */
function useDebouncedValue<T>(value: T, delay = 600): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Reintento con backoff y soporte de abortos
 */
const fetchWithRetry = async (
  fetcher: (signal?: AbortSignal) => Promise<Response>,
  { maxRetries = 5, delayMs = 500, signal }: { maxRetries?: number; delayMs?: number; signal?: AbortSignal } = {}
): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetcher(signal);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error: any) {
      // Si fue abortado, no seguimos reintentando
      if (error?.name === 'AbortError') throw error;
      if (i === maxRetries - 1) throw new Error('Failed to fetch data after multiple retries.');
      const delay = delayMs * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Exhausted retries without success.');
};

const App: React.FC = () => {
  const [posts, setPosts] = useState<PostCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda global por nombre (controla el input)
  const [searchKey, setSearchKey] = useState<string>('');

  // Filtro por palabra clave (chips)
  const [keywordFilter, setKeywordFilter] = useState('');

  // Ordenamiento
  const [sorting, setSorting] = useState<{ column: 'name' | 'postCount'; direction: 'asc' | 'desc' }>({
    column: 'name',
    direction: 'asc',
  });

  const debouncedSearch = useDebouncedValue(searchKey, 700);

  const currentAbortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (searchTerm: string = '') => {
      // Cancela el request anterior (si existe)
      if (currentAbortRef.current) currentAbortRef.current.abort();
      const controller = new AbortController();
      currentAbortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const url = API_URL.startsWith('http')
                    ? new URL(API_URL)
                    : new URL(API_URL, window.location.origin);
        const trimmed = searchTerm.trim();
        if (trimmed) url.searchParams.set('name', trimmed);

        const response = await fetchWithRetry(
          (signal) => fetch(url.toString(), { signal }),
          { maxRetries: 4, delayMs: 400, signal: controller.signal }
        );
        
        if (!response.ok) {
            throw new Error(`Fallo al conectar con el backend: ${response.status}`);
        }
        const data = (await response.json()) as PostCount[];
        setPosts(data);
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        console.error(err);
        setError('Error al cargar los datos. El backend puede no estar disponible.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Carga inicial
  useEffect(() => {
    fetchData('');
  }, []);

  // Llama API cuando cambia el valor debounced, a menos que haya filtro por palabra clave activo
  useEffect(() => {
    if (keywordFilter) return;
    fetchData(debouncedSearch);
  }, [debouncedSearch, keywordFilter, fetchData]);

  // Ordenamiento
  const handleSort = useCallback((column: 'name' | 'postCount') => {
    setSorting((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const filteredPosts = useMemo(() => {
    let current = [...posts];

    // Orden
    current.sort((a, b) => {
      const valA = a[sorting.column];
      const valB = b[sorting.column];
      let cmp = 0;
      if (valA > valB) cmp = 1;
      if (valA < valB) cmp = -1;
      return sorting.direction === 'asc' ? cmp : -cmp;
    });

    // Filtro por palabra clave (name)
    if (keywordFilter) {
      const term = keywordFilter.toLowerCase();
      return current.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.topWords.some((w) => w.word.toLowerCase().includes(term))
      );
    }

    return current;
  }, [posts, keywordFilter, sorting.column, sorting.direction]);

  // Handlers
  const handleGlobalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKey(e.target.value); 
    setKeywordFilter(''); 
  };

  const handleKeywordClick = (word: string) => {
    setKeywordFilter((prev) => (prev === word ? '' : word));
    setSearchKey('');
  };

  const handleClearFilter = () => {
    setKeywordFilter('');
    setSearchKey('');
    fetchData(''); // fuerza refresco sin filtros
  };

  const appBaseClasses = `
    min-h-screen bg-gray-100 w-screen overflow-x-hidden p-2 md:py-12 md:px-4 font-sans
  `;

  return (
    <div className={appBaseClasses}>
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-indigo-800 dark:text-indigo-400">
          Comentarios OffyMarket
        </h1>
        <p className="text-sm sm:text-md lg:text-xl text-gray-600 dark:text-gray-400 mt-2">
          (ReactJS/TS + TailwindCSS)
        </p>
      </header>

      <div className="w-full bg-white dark:bg-gray-800 p-4 md:p-6 shadow-2xl rounded-xl transition-colors duration-300">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-grow relative">
            <input
              type="text"
              placeholder="Filtrar por nombre"
              value={searchKey}
              onChange={handleGlobalSearchChange}
              className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-inner"
            />
          </div>

          <button
            onClick={handleClearFilter}
            disabled={!searchKey && !keywordFilter}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition duration-200 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            {keywordFilter ? `Quitar Filtro: "${keywordFilter}"` : 'Borrar Filtros'}
          </button>
        </div>

        {loading && (
          <div className="text-center py-8 text-indigo-600 dark:text-indigo-400">
            Cargando datos del backend...
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600 dark:text-red-400">Error: {error}</div>
        )}

        {!loading && !error && (
          <PostTable
            posts={filteredPosts}
            activeFilter={keywordFilter}
            onKeywordClick={handleKeywordClick}
            handleSort={handleSort}
            sorting={sorting}
          />
        )}
      </div>
    </div>
  );
};

export default App;
