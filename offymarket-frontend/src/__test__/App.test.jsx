import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';

vi.mock('../components/table', () => {
  const TableMock = ({ posts, onKeywordClick, handleSort }) => (
    <div>
      <div>
        <button onClick={() => handleSort('name')}>sort-name</button>
        <button onClick={() => handleSort('postCount')}>sort-postCount</button>
      </div>
      <ul data-testid="rows">
        {posts.map((p) => (
          <li key={p.name}>
            <span data-testid="row-name">{p.name}</span>
            <span data-testid="row-count">{String(p.postCount)}</span>
            <div>
              {(p.topWords || []).map((w) => (
                <button
                  key={`${p.name}-${w.word}`}
                  data-testid={`chip-${w.word}`}
                  onClick={() => onKeywordClick(w.word)}
                >
                  {w.word}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
  return { default: TableMock };
});

import App from '../App';

const T = 15000; // timeout por test (Vitest)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const flushMicrotasks = async (n = 2) => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

// Dataset y response helper
const BASE_DATA = [
  { name: 'Alice', postCount: 5, topWords: [{ word: 'react' }, { word: 'hooks' }] },
  { name: 'Bob', postCount: 12, topWords: [{ word: 'js' }, { word: 'vite' }] },
  { name: 'Carol', postCount: 8, topWords: [{ word: 'testing' }] },
];

const okResponse = (data) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

let fetchSpy;

function mockFetchWithAbort({ delayMs = 0, handler } = {}) {
  fetchSpy.mockImplementation((input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.toString?.() ?? '';
    const signal = init.signal;

    return new Promise((resolve, reject) => {
      const onAbort = () => {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        reject(err);
      };
      if (signal?.aborted) onAbort();
      signal?.addEventListener?.('abort', onAbort, { once: true });

      const finish = async () => {
        try {
          if (delayMs > 0) await sleep(delayMs);
          const resp = handler ? handler(url) : okResponse(BASE_DATA);
          resolve(resp);
        } catch (e) {
          reject(e);
        } finally {
          signal?.removeEventListener?.('abort', onAbort);
        }
      };

      // Ejecuta asíncrono
      finish();
    });
  });
}

beforeEach(() => {
  fetchSpy = vi.spyOn(global, 'fetch');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ==== TESTS ====
describe('App (React + Vite) - pruebas de integración con Vitest', () => {
  it(
    'renderiza encabezado y muestra estado de carga, luego filas',
    async () => {
      mockFetchWithAbort({ handler: () => okResponse(BASE_DATA) });

      render(<App />);

      expect(
        screen.getByText(/Cargando datos del backend/i)
      ).toBeInTheDocument();

      await flushMicrotasks();

      await waitFor(() =>
        expect(
          screen.queryByText(/Cargando datos del backend/i)
        ).not.toBeInTheDocument()
      );

      const rows = screen.getAllByTestId('row-name').map((el) => el.textContent);
      expect(rows).toEqual(['Alice', 'Bob', 'Carol']);

      expect(fetchSpy).toHaveBeenCalled(); // primera carga
    },
    T
  );

  it(
    'aplica debounce (700ms) al buscar por nombre y pasa ?name=...',
    async () => {
      mockFetchWithAbort({
        handler: (url) => {
          const u = new URL(url, 'http://localhost');
          const name = u.searchParams.get('name');
          const data = name
            ? BASE_DATA.filter((p) =>
                p.name.toLowerCase().includes(name.toLowerCase())
              )
            : BASE_DATA;
          return okResponse(data);
        },
      });

      render(<App />);

      // Resuelve la carga inicial
      await flushMicrotasks();
      await waitFor(() =>
        expect(
          screen.queryByText(/Cargando datos del backend/i)
        ).not.toBeInTheDocument()
      );

      const input = screen.getByPlaceholderText(/Filtrar por nombre/i);
      fetchSpy.mockClear();

      fireEvent.change(input, { target: { value: 'ali' } });

      await act(async () => {
        await sleep(720);
      });
      await flushMicrotasks();

      await waitFor(() => {
        const calledWith = fetchSpy.mock.calls.map((c) => String(c[0]));
        expect(calledWith.some((u) => u.includes('name=ali'))).toBe(true);
      });

      const rows = screen.getAllByTestId('row-name').map((el) => el.textContent);
      expect(rows).toEqual(['Alice']);
    },
    T
  );

  it(
    'cancela la petición previa con AbortController al tipear rápido (no muestra error por AbortError)',
    async () => {
      mockFetchWithAbort({
        delayMs: 50,
        handler: (url) => {
          const u = new URL(url, 'http://localhost');
          const name = u.searchParams.get('name') ?? '';
          const data = name
            ? BASE_DATA.filter((p) =>
                p.name.toLowerCase().includes(name.toLowerCase())
              )
            : BASE_DATA;
          return okResponse(data);
        },
      });

      render(<App />);

      // Resuelve la carga inicial
      await flushMicrotasks();
      await waitFor(() =>
        expect(
          screen.queryByText(/Cargando datos del backend/i)
        ).not.toBeInTheDocument()
      );

      const input = screen.getByPlaceholderText(/Filtrar por nombre/i);
      fetchSpy.mockClear();

      // Primer término (no esperamos 700ms aún)
      fireEvent.change(input, { target: { value: 'al' } });
      await act(async () => {
        await sleep(350);
      });

      // Cambia rápido al segundo término
      fireEvent.change(input, { target: { value: 'bob' } });

      // Completa el debounce del segundo término
      await act(async () => {
        await sleep(720);
      });
      await flushMicrotasks();

      // Se hizo la petición con ?name=bob
      await waitFor(() => {
        const calledWith = fetchSpy.mock.calls.map((c) => String(c[0]));
        expect(calledWith.some((u) => u.includes('name=bob'))).toBe(true);
      });

      // Espera a que termine el loading y se rendericen filas
      await waitFor(() =>
        expect(
          screen.queryByText(/Cargando datos del backend/i)
        ).not.toBeInTheDocument()
      );

      // No debe mostrar error
      expect(
        screen.queryByText(/Error al cargar los datos/i)
      ).not.toBeInTheDocument();

      const rows = screen.getAllByTestId('row-name').map((el) => el.textContent);
      expect(rows).toEqual(['Bob']);
    },
    T
  );

  it(
    'al hacer click en un chip (keywordFilter) NO llama al backend por el click; al escribir se limpia el chip y SÍ llama',
    async () => {
      mockFetchWithAbort({ handler: () => okResponse(BASE_DATA) });

      render(<App />);

      await flushMicrotasks();
      await waitFor(() =>
        expect(
          screen.queryByText(/Cargando datos del backend/i)
        ).not.toBeInTheDocument()
      );

      fetchSpy.mockClear();

      // Click en el chip "js" (de Bob) -> solo filtra en memoria, no backend
      fireEvent.click(screen.getByTestId('chip-js'));
      await flushMicrotasks();
      expect(fetchSpy).not.toHaveBeenCalled();

      // Filas solo Bob
      const rowsAfterChip = screen
        .getAllByTestId('row-name')
        .map((el) => el.textContent);
      expect(rowsAfterChip).toEqual(['Bob']);

      // Escribe: la App limpia el chip y vuelve a usar búsqueda remota con debounce
      const input = screen.getByPlaceholderText(/Filtrar por nombre/i);
      fireEvent.change(input, { target: { value: 'alice' } });

      await act(async () => {
        await sleep(800); // >700 debounce
      });
      await flushMicrotasks();

      // Ahora sí debió llamar al backend con ?name=alice
      const calledWith = fetchSpy.mock.calls.map((c) => String(c[0]));
      expect(calledWith.some((u) => u.includes('name=alice'))).toBe(true);
    },
    T
  );

  it(
    'botón "Borrar Filtros" limpia filtros y vuelve a solicitar datos',
    async () => {
      mockFetchWithAbort({ handler: () => okResponse(BASE_DATA) });

      render(<App />);

      await flushMicrotasks();
      await waitFor(() =>
        expect(
          screen.queryByText(/Cargando datos del backend/i)
        ).not.toBeInTheDocument()
      );

      // Activa chip para habilitar botón
      fireEvent.click(screen.getByTestId('chip-js'));
      await flushMicrotasks();

      fetchSpy.mockClear();

      const btn = screen.getByRole('button', { name: /Quitar Filtro: "js"|Borrar Filtros/ });
      fireEvent.click(btn);

      // Da tiempo a que dispare fetch sin filtros
      await act(async () => {
        await sleep(40);
      });
      await flushMicrotasks();

      // Se debe haber llamado nuevamente al backend (cualquier URL de posts)
      await waitFor(() => {
        const called = fetchSpy.mock.calls.map((c) => String(c[0]));
        expect(called.some((u) => u.includes('/posts'))).toBe(true);
      });

      const rows = screen.getAllByTestId('row-name').map((el) => el.textContent);
      expect(rows).toEqual(['Alice', 'Bob', 'Carol']);
    },
    T
  );

  it(
    'ordenamiento alterna entre asc/desc y se refleja en el render',
    async () => {
      mockFetchWithAbort({ handler: () => okResponse(BASE_DATA) });

      render(<App />);

      await flushMicrotasks();
      await waitFor(() =>
        expect(
          screen.queryByText(/Cargando datos del backend/i)
        ).not.toBeInTheDocument()
      );

      const getOrder = () =>
        screen.getAllByTestId('row-name').map((el) => el.textContent);

      // Por defecto: asc por name
      expect(getOrder()).toEqual(['Alice', 'Bob', 'Carol']);

      // Cambia sort -> name desc
      fireEvent.click(screen.getByText('sort-name'));
      await flushMicrotasks();
      expect(getOrder()).toEqual(['Carol', 'Bob', 'Alice']);

      // Cambia sort -> postCount asc (5,8,12)
      fireEvent.click(screen.getByText('sort-postCount'));
      await flushMicrotasks();
      expect(getOrder()).toEqual(['Alice', 'Carol', 'Bob']);

      // Alterna a desc (12,8,5)
      fireEvent.click(screen.getByText('sort-postCount'));
      await flushMicrotasks();
      expect(getOrder()).toEqual(['Bob', 'Carol', 'Alice']);
    },
    T
  );

  it(
    'muestra estado de error cuando el backend responde !ok (500)',
    async () => {
      mockFetchWithAbort({
        handler: () => new Response('fail', { status: 500 }),
      });

      render(<App />);

      // Deja tiempo para que fetchWithRetry agote reintentos (400+800+1600 ≈ 2800ms)
      await act(async () => {
        await sleep(3200);
      });
      await flushMicrotasks();

      await waitFor(() =>
        expect(
          screen.getByText(/Error al cargar los datos\. El backend puede no estar disponible\./i)
        ).toBeInTheDocument()
      );
    },
    T
  );
});
