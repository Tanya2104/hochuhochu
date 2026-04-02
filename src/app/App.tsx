import { useEffect, useState, type FormEvent } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { AppHeader } from '../components/layout/AppHeader';
import { ProfileHero } from '../features/profile/components/ProfileHero';
import { WishlistGrid } from '../features/wishlist/components/WishlistGrid';
import type { WishlistItem, WishlistPriority } from '../features/wishlist/types';

const priorityLabels: Record<WishlistPriority, string> = {
  nice: 'Можно',
  love: 'Очень хочу',
  urgent: 'Срочно хочу',
  cute: 'Милая мелочь',
};

const WISHLIST_STORAGE_KEY = 'hochuhochu-wishlist';

export default function App() {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? (parsed as WishlistItem[]) : [];
    } catch {
      return [];
    }
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState<WishlistPriority>('nice');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setLink('');
    setPriority('nice');
  };

  const closeForm = () => {
    resetForm();
    setEditingItemId(null);
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));

    if (editingItemId === id) {
      closeForm();
    }
  };

  const handleEdit = (item: WishlistItem) => {
    setEditingItemId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(item.price);
    setLink(item.link);
    setPriority(item.priority);
    setIsFormOpen(true);
  };

  const handleToggleForm = () => {
    if (isFormOpen) {
      closeForm();
      return;
    }

    setIsFormOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const trimmedDescription = description.trim();
    const trimmedPrice = price.trim();
    const trimmedLink = link.trim();

    if (editingItemId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                title: trimmedTitle,
                description: trimmedDescription || 'Без описания',
                price: trimmedPrice || '—',
                link: trimmedLink || 'https://example.com',
                priority,
              }
            : item,
        ),
      );
    } else {
      const newItem: WishlistItem = {
        id: Date.now().toString(),
        title: trimmedTitle,
        description: trimmedDescription || 'Без описания',
        price: trimmedPrice || '—',
        link: trimmedLink || 'https://example.com',
        priority,
      };

      setItems((prev) => [newItem, ...prev]);
    }

    closeForm();
  };

  return (
    <AppShell>
      <AppHeader />
      <ProfileHero />

      <section className="mb-6 sm:mb-8">
        <button
          type="button"
          onClick={handleToggleForm}
          className="w-full rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
        >
          {isFormOpen ? 'Скрыть форму' : 'Добавить хотелку'}
        </button>
      </section>

      {isFormOpen ? (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-2xl border border-rose-100 bg-rose-50/70 p-4 shadow-sm sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-rose-900">
              {editingItemId ? 'Редактировать хотелку' : 'Добавить хотелку'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
            >
              Закрыть
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-rose-900">
              Название
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например, беспроводные наушники"
              className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-rose-900">
              Описание
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Коротко опишите, почему эта вещь важна"
              className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="price" className="block text-sm font-medium text-rose-900">
                Цена
              </label>
              <input
                id="price"
                type="text"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Например, 9 990 ₽"
                className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="block text-sm font-medium text-rose-900">
                Приоритет
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as WishlistPriority)}
                className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
              >
                <option value="nice">{priorityLabels.nice}</option>
                <option value="love">{priorityLabels.love}</option>
                <option value="urgent">{priorityLabels.urgent}</option>
                <option value="cute">{priorityLabels.cute}</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="link" className="block text-sm font-medium text-rose-900">
              Ссылка
            </label>
            <input
              id="link"
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://example.com/product"
              className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-600"
          >
            {editingItemId ? 'Сохранить изменения' : 'Сохранить хотелку'}
          </button>
        </form>
      ) : null}

      <WishlistGrid items={items} onDelete={handleDelete} onEdit={handleEdit} />
    </AppShell>
  );
}
