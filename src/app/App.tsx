import { useEffect, useState, type FormEvent } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { AppHeader } from '../components/layout/AppHeader';
import { ProfileHero } from '../features/profile/components/ProfileHero';
import { WishlistGrid } from '../features/wishlist/components/WishlistGrid';
import type { WishlistItem, WishlistPriority } from '../features/wishlist/types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Database } from '../types/database';

const priorityLabels: Record<WishlistPriority, string> = {
  nice: 'Можно',
  love: 'Очень хочу',
  urgent: 'Срочно хочу',
  cute: 'Милая мелочь',
};

const WISHLIST_STORAGE_KEY = 'hochuhochu-wishlist';

type WishlistRow = Database['public']['Tables']['wishlist_items']['Row'];
type WishlistInsert = Database['public']['Tables']['wishlist_items']['Insert'];
type WishlistUpdate = Database['public']['Tables']['wishlist_items']['Update'];

const isWishlistPriority = (value: unknown): value is WishlistPriority =>
  value === 'nice' || value === 'love' || value === 'urgent' || value === 'cute';

const isWishlistItem = (value: unknown): value is WishlistItem => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<WishlistItem>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.price === 'string' &&
    typeof candidate.link === 'string' &&
    isWishlistPriority(candidate.priority)
  );
};

const normalizeWishlistRow = (row: WishlistRow): WishlistItem | null => {
  if (!isWishlistPriority(row.priority)) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    priority: row.priority,
    link: row.link,
  };
};

const getFallbackItems = (): WishlistItem[] => {
  const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isWishlistItem) : [];
  } catch {
    return [];
  }
};

export default function App() {
  const isPublicView = new URLSearchParams(window.location.search).get('view') === 'public';
  const hasSupabase = isSupabaseConfigured && supabase !== null;
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState<WishlistPriority>('nice');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'success' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      if (!hasSupabase || !supabase) {
        setItems(getFallbackItems());
        setRequestError(
          'Supabase пока не настроен. Приложение работает без облачной синхронизации.',
        );
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setItems(getFallbackItems());
        setRequestError('Не удалось загрузить хотелки из облака. Показываем локально сохранённый список.');
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as WishlistRow[];
      const normalizedItems = rows
        .map(normalizeWishlistRow)
        .filter((item): item is WishlistItem => item !== null);

      setItems(normalizedItems);
      setRequestError(null);
      setIsLoading(false);
    };

    void loadItems();
  }, []);

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

  const handleDelete = async (id: string) => {
    if (isPublicView) {
      return;
    }

    if (!hasSupabase || !supabase) {
      setRequestError('Удаление недоступно, пока не настроен Supabase.');
      return;
    }

    const { error } = await supabase.from('wishlist_items').delete().eq('id', id);

    if (error) {
      setRequestError('Не удалось удалить хотелку. Попробуй ещё раз.');
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setRequestError(null);

    if (editingItemId === id) {
      closeForm();
    }
  };

  const handleEdit = (item: WishlistItem) => {
    if (isPublicView) {
      return;
    }

    setEditingItemId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(item.price);
    setLink(item.link);
    setPriority(item.priority);
    setIsFormOpen(true);
  };

  const handleToggleForm = () => {
    if (isPublicView) {
      return;
    }

    if (isFormOpen) {
      closeForm();
      return;
    }

    setIsFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPublicView) {
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    if (!hasSupabase || !supabase) {
      setRequestError('Сохранение недоступно, пока не настроен Supabase.');
      return;
    }

    const basePayload = {
      title: trimmedTitle,
      description: description.trim() || 'Без описания',
      price: price.trim() || '—',
      link: link.trim() || 'https://example.com',
      priority,
    };

    if (editingItemId) {
      const updatePayload: WishlistUpdate = basePayload;

      const { data, error } = await supabase
        .from('wishlist_items')
        .update(updatePayload)
        .eq('id', editingItemId)
        .select()
        .single();

      if (error) {
        setRequestError('Не удалось сохранить изменения. Попробуй ещё раз.');
        return;
      }

      const normalizedItem = normalizeWishlistRow(data);
      if (!normalizedItem) {
        setRequestError('Данные после обновления пришли в неверном формате.');
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === editingItemId ? normalizedItem : item)));
    } else {
      const insertPayload: WishlistInsert = basePayload;

      const { data, error } = await supabase
        .from('wishlist_items')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        setRequestError('Не удалось добавить хотелку. Попробуй ещё раз.');
        return;
      }

      const normalizedItem = normalizeWishlistRow(data);
      if (!normalizedItem) {
        setRequestError('Данные после добавления пришли в неверном формате.');
        return;
      }

      setItems((prev) => [normalizedItem, ...prev]);
    }

    setRequestError(null);
    closeForm();
  };

  const buildPublicShareLink = () =>
    `${window.location.origin}${window.location.pathname}?view=public`;

  const handleShare = async () => {
    const shareLink = buildPublicShareLink();

    try {
      await navigator.clipboard.writeText(shareLink);
      setShareStatus('success');
    } catch {
      setShareStatus('error');
    }
  };

  return (
    <AppShell>
      <AppHeader isPublicView={isPublicView} />
      <ProfileHero isPublicView={isPublicView} />

      {!isPublicView ? (
        <section className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleToggleForm}
              className="w-full rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
            >
              {isFormOpen ? 'Скрыть форму' : 'Добавить хотелку'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="w-full rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
            >
              Поделиться ссылкой
            </button>
          </div>
          {shareStatus ? (
            <p className="mt-2 text-xs text-rose-700">
              {shareStatus === 'success' ? 'Ссылка скопирована' : 'Не удалось скопировать ссылку'}
            </p>
          ) : null}
          {requestError ? <p className="mt-2 text-xs text-rose-700">{requestError}</p> : null}
        </section>
      ) : requestError ? (
        <section className="mb-6 sm:mb-8">
          <p className="mt-2 text-xs text-rose-700">{requestError}</p>
        </section>
      ) : null}

      {!isPublicView && isFormOpen ? (
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

      {isLoading ? (
        <p className="rounded-2xl border border-rose-100 bg-white/90 p-6 text-sm text-slate-500 shadow-sm sm:text-base">
          Загружаем хотелки...
        </p>
      ) : (
        <WishlistGrid
          items={items}
          onDelete={handleDelete}
          onEdit={handleEdit}
          isReadOnly={isPublicView}
        />
      )}
    </AppShell>
  );
}
