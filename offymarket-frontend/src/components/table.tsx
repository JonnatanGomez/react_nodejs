import React, { useCallback } from 'react';
import { type PostCount } from '../models/types';

interface PostTableProps {
  posts: PostCount[];
  activeFilter: string;
  onKeywordClick: (word: string) => void;
  handleSort: (column: 'name' | 'postCount') => void;
  sorting: { column: 'name' | 'postCount'; direction: 'asc' | 'desc' };
}

const exportToCsv = (data: PostCount[], filename: string) => {
  if (data.length === 0) return;

  const headers = ['Nombre', 'Conteo', 'PalabrasComunes'];

  const csvContent = data
    .map((row) => {
      const topWordsString = row.topWords.map((w) => `${w.word} (${w.count})`).join('; ');
      const safeName = `"${row.name.replace(/"/g, '""')}"`;
      return [safeName, row.postCount, `"${topWordsString.replace(/"/g, '""')}"`].join(',');
    })
    .join('\n');

  const csv = `${headers.join(',')}\n${csvContent}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const PostTableComponent: React.FC<PostTableProps> = ({
  posts,
  activeFilter,
  onKeywordClick,
  handleSort,
  sorting,
}) => {
  const handleExport = useCallback(() => {
    exportToCsv(posts, 'offymarket_export.csv');
  }, [posts]);

  const getSortIcon = (column: 'name' | 'postCount') => {
    if (sorting.column !== column) return ' ↕';
    return sorting.direction === 'asc' ? ' ▲' : ' ▼';
    };

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExport}
          disabled={posts.length === 0}
          className="px-6 py-2 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg shadow-md transition duration-200 
                     hover:bg-gray-100 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                     dark:bg-white dark:text-gray-700 dark:border-gray-300 dark:hover:bg-gray-100"
        >
          {posts.length > 0 ? `📄 Exportar ${posts.length} Filas a Excel (CSV)` : 'No hay datos para exportar'}
        </button>
      </div>

      <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[200px]"
                onClick={() => handleSort('name')}
              >
                NOMBRE {getSortIcon('name')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[100px]"
                onClick={() => handleSort('postCount')}
              >
                CONTEO {getSortIcon('postCount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[400px]">
                Palabras repetidas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {posts.map((post) => (
              <tr key={post.name} className="hover:bg-indigo-50 transition duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{post.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{post.postCount}</td>
                <td className="px-6 py-4 text-sm text-gray-800">
                  <div className="flex flex-wrap gap-2">
                    {post.topWords.map((wordData) => {
                      const isActive = activeFilter === wordData.word;
                      const fontSize = `${12 + wordData.count / 3}px`;
                      return (
                        <button
                          key={wordData.word}
                          onClick={() => onKeywordClick(wordData.word)}
                          style={{ fontSize }}
                          className={`
                            px-3 py-1 rounded-full text-xs font-medium transition duration-150 ease-in-out shadow-sm
                            ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-indigo-400/50 hover:bg-indigo-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-gray-300/50'
                            }
                          `}
                          title={`Aparece ${wordData.count} veces. Click para filtrar.`}
                        >
                          {wordData.word} ({wordData.count})
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-lg text-gray-500">
                  No se encontraron resultados para los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PostTable = React.memo(PostTableComponent);
export default PostTable;
