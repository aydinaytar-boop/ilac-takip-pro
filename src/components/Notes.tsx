import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, NotebookPen } from 'lucide-react';
import type { HealthNote } from '../types';
import IconTile from './IconTile';

interface NotesProps {
  notes: HealthNote[];
  onAdd: (content: string) => void;
  onDelete: (id: string) => void;
}

export default function Notes({ notes, onAdd, onDelete }: NotesProps) {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    onAdd(content);
    setText('');
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        {t('notes.title')}
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm">
        <textarea
          rows={3}
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('notes.placeholder')}
          aria-label={t('notes.add')}
          className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:border-blue-400 resize-none"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 disabled:opacity-40 text-white text-sm rounded-xl font-medium shadow-sm shadow-pink-500/30"
        >
          <Plus size={16} />
          {t('notes.add')}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <IconTile
            icon={NotebookPen}
            gradient="from-fuchsia-500 to-pink-600"
            size={56}
            className="mx-auto mb-3"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('notes.noNotes')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((note) => (
            <li
              key={note.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                    {formatDate(note.createdAt)}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmId(note.id)}
                  aria-label={t('notes.delete')}
                  title={t('notes.delete')}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {confirmId === note.id && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                    {t('notes.delete')}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onDelete(note.id);
                        setConfirmId(null);
                      }}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-xl font-medium"
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl"
                    >
                      {t('common.no')}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
