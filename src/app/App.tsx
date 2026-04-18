import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
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
const WISHLIST_IMAGE_BUCKET = 'wishlist-images';

type WishlistRow = Database['public']['Tables']['wishlist_items']['Row'];
type WishlistInsert = Database['public']['Tables']['wishlist_items']['Insert'];
type WishlistUpdate = Database['public']['Tables']['wishlist_items']['Update'];
type StatusTone = 'success' | 'error';

type StatusMessage = {
  text: string;
  tone: StatusTone;
};

type UploadStatus = {
  text: string;
  tone: StatusTone;
};

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
    (typeof candidate.imageUrl === 'string' ||
      candidate.imageUrl === null ||
      typeof candidate.imageUrl === 'undefined') &&
    (typeof candidate.reserved === 'boolean' || typeof candidate.reserved === 'undefined') &&
    (typeof candidate.reservedBy === 'string' ||
      candidate.reservedBy === null ||
      typeof candidate.reservedBy === 'undefined') &&
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
    imageUrl: row.image_url,
    reserved: row.reserved ?? false,
    reservedBy: row.reserved_by ?? null,
  };
};

const getFallbackItems = (): WishlistItem[] => {
  const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isWishlistItem).map((item) => ({
      ...item,
      imageUrl: item.imageUrl ?? null,
      reserved: item.reserved ?? false,
      reservedBy: item.reservedBy ?? null,
    }));
  } catch {
    return [];
  }
};

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const isPublicView = searchParams.get('view') === 'public';
  const adminSecret = import.meta.env.VITE_ADMIN_SECRET;
  const adminParam = searchParams.get('admin');
  const isAdminAuthorized =
    typeof adminParam === 'string' &&
    adminParam.length > 0 &&
    typeof adminSecret === 'string' &&
    adminParam === adminSecret;
  const canManageWishlist = !isPublicView && isAdminAuthorized;
  const hasSupabase = isSupabaseConfigured && supabase !== null;
  const [items, setItems] = useState<WishlistItem[]>(() => getFallbackItems());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [priority, setPriority] = useState<WishlistPriority>('nice');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [sessionReservedItemIds, setSessionReservedItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

  useEffect(() => {
    const loadItems = async () => {
      if (!hasSupabase || !supabase) {
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
        setRequestError('Не удалось загрузить хотелки из облака. Показываем локально сохранённый список.');
        setIsLoading(false);
        return;
      }

      if (!data) {
        setRequestError('Облако не вернуло данные. Показываем локально сохранённый список.');
        setIsLoading(false);
        return;
      }

      const rows = data as WishlistRow[];
      const normalizedItems = rows
        .map(normalizeWishlistRow)
        .filter((item): item is WishlistItem => item !== null);

      if (rows.length > 0 && normalizedItems.length === 0) {
        setRequestError('Не удалось прочитать формат данных из облака. Показываем локально сохранённый список.');
        setIsLoading(false);
        return;
      }

      setItems(normalizedItems);
      setRequestError(null);
      setIsLoading(false);
    };

    void loadItems();
  }, []);

  useEffect(() => {
    if (hasSupabase) {
      return;
    }

    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [hasSupabase, items]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setLink('');
    setImageUrl(null);
    setPriority('nice');
    setUploadStatus(null);
    setIsImageUploading(false);
  };

  const closeForm = () => {
    resetForm();
    setEditingItemId(null);
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!canManageWishlist) {
      return;
    }

    const isConfirmed = window.confirm('Удалить эту хотелку?');
    if (!isConfirmed) {
      return;
    }

    if (!hasSupabase || !supabase) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRequestError(null);
      setStatusMessage({ text: 'Хотелка удалена', tone: 'success' });

      if (editingItemId === id) {
        closeForm();
      }
      return;
    }

    const { error } = await supabase.from('wishlist_items').delete().eq('id', id);

    if (error) {
      setRequestError('Не удалось удалить хотелку. Попробуй ещё раз.');
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setRequestError(null);
    setStatusMessage({ text: 'Хотелка удалена', tone: 'success' });

    if (editingItemId === id) {
      closeForm();
    }
  };

  const handleEdit = (item: WishlistItem) => {
    if (!canManageWishlist) {
      return;
    }

    setEditingItemId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(item.price);
    setLink(item.link);
    setImageUrl(item.imageUrl);
    setPriority(item.priority);
    setUploadStatus(null);
    setIsImageUploading(false);
    setIsFormOpen(true);
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!hasSupabase || !supabase) {
      setUploadStatus({ text: 'Не удалось загрузить изображение', tone: 'error' });
      setRequestError('Загрузка изображений доступна только при подключённом Supabase.');
      return;
    }

    setUploadStatus({ text: 'Загружаем изображение...', tone: 'success' });
    setIsImageUploading(true);

    const uniqueName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from(WISHLIST_IMAGE_BUCKET)
      .upload(uniqueName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      setUploadStatus({ text: 'Не удалось загрузить изображение', tone: 'error' });
      setIsImageUploading(false);
      return;
    }

    const { data } = supabase.storage.from(WISHLIST_IMAGE_BUCKET).getPublicUrl(uniqueName);
    if (!data.publicUrl) {
      setUploadStatus({ text: 'Не удалось загрузить изображение', tone: 'error' });
      setIsImageUploading(false);
      return;
    }

    setImageUrl(data.publicUrl);
    setUploadStatus({ text: 'Изображение загружено', tone: 'success' });
    setRequestError(null);
    setIsImageUploading(false);
  };

  const handleToggleForm = () => {
    if (!canManageWishlist) {
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

    if (!canManageWishlist) {
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const basePayload = {
      title: trimmedTitle,
      description: description.trim() || 'Без описания',
      price: price.trim() || '—',
      link: link.trim() || 'https://example.com',
      priority,
    };
    const dbPayload = {
      ...basePayload,
      image_url: imageUrl,
    };

    if (!hasSupabase || !supabase) {
      if (editingItemId) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingItemId ? { ...item, ...basePayload, imageUrl } : item,
          ),
        );
      } else {
        const localItem: WishlistItem = {
          id: crypto.randomUUID(),
          ...basePayload,
          imageUrl,
          reserved: false,
          reservedBy: null,
        };
        setItems((prev) => [localItem, ...prev]);
      }

      setRequestError(null);
      setStatusMessage({ text: 'Хотелка сохранена', tone: 'success' });
      closeForm();
      return;
    }

    if (editingItemId) {
      const updatePayload: WishlistUpdate = dbPayload;

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
      const insertPayload: WishlistInsert = dbPayload;

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
    setStatusMessage({ text: 'Хотелка сохранена', tone: 'success' });
    closeForm();
  };

  const buildPublicShareLink = () =>
    `${window.location.origin}${window.location.pathname}?view=public`;

  const handleShare = async () => {
    const shareLink = buildPublicShareLink();

    try {
      await navigator.clipboard.writeText(shareLink);
      setStatusMessage({ text: 'Ссылка скопирована', tone: 'success' });
    } catch {
      setStatusMessage({ text: 'Не удалось скопировать ссылку', tone: 'error' });
    }
  };

  const handleReserve = async (item: WishlistItem) => {
    if (!isPublicView || item.reserved) {
      return;
    }

    const input = window.prompt('Как вас зовут?');
    const reserverName = input?.trim() ?? '';
    if (!reserverName) {
      return;
    }

    if (!hasSupabase || !supabase) {
      setRequestError(
        'Бронирование работает только при подключённом Supabase. Сейчас доступен только просмотр.',
      );
      return;
    }

    const { data, error } = await supabase
      .from('wishlist_items')
      .update({
        reserved: true,
        reserved_by: reserverName,
      })
      .eq('id', item.id)
      .eq('reserved', false)
      .select()
      .single();

    if (error) {
      setRequestError('Не удалось забронировать подарок. Возможно, его уже заняли.');
      return;
    }

    const normalizedItem = normalizeWishlistRow(data);
    if (!normalizedItem) {
      setRequestError('Данные после бронирования пришли в неверном формате.');
      return;
    }

    setItems((prev) => prev.map((current) => (current.id === item.id ? normalizedItem : current)));
    setSessionReservedItemIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
    setRequestError(null);
    setStatusMessage({ text: 'Готово! Подарок забронирован.', tone: 'success' });
  };

  const handleUnreserve = async (id: string) => {
    const canUnreserveInPublicSession = isPublicView && sessionReservedItemIds.has(id);

    if (!canManageWishlist && !canUnreserveInPublicSession) {
      return;
    }

    if (!hasSupabase || !supabase) {
      setRequestError(
        'Снять бронь можно только при подключённом Supabase. Сейчас доступен только просмотр.',
      );
      return;
    }

    const { data, error } = await supabase
      .from('wishlist_items')
      .update({
        reserved: false,
        reserved_by: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setRequestError('Не удалось снять бронь. Попробуй ещё раз.');
      return;
    }

    const normalizedItem = normalizeWishlistRow(data);
    if (!normalizedItem) {
      setRequestError('Данные после снятия брони пришли в неверном формате.');
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? normalizedItem : item)));
    setSessionReservedItemIds((prev) => {
      if (!prev.has(id)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setRequestError(null);
    setStatusMessage({
      text: canUnreserveInPublicSession ? 'Бронь отменена' : 'Бронь снята',
      tone: 'success',
    });
  };

  return (
    <AppShell>
      <AppHeader isPublicView={isPublicView} />
      <ProfileHero isPublicView={isPublicView} />

      {statusMessage ? (
        <section className="mb-4 sm:mb-5">
          <div
            className={`rounded-xl border px-3 py-2 text-xs shadow-sm sm:text-sm ${
              statusMessage.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
            role="status"
            aria-live="polite"
          >
            {statusMessage.text}
          </div>
        </section>
      ) : null}

      {!isPublicView ? (
        <section className="mb-6 sm:mb-8">
          {canManageWishlist ? (
            <>
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
            </>
          ) : (
            <p className="mt-2 text-xs text-rose-700">
              Режим просмотра. Для редактирования нужна admin-ссылка.
            </p>
          )}
          {requestError ? <p className="mt-2 text-xs text-rose-700">{requestError}</p> : null}
        </section>
      ) : requestError ? (
        <section className="mb-6 sm:mb-8">
          <p className="mt-2 text-xs text-rose-700">{requestError}</p>
        </section>
      ) : null}

      {canManageWishlist && isFormOpen ? (
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

          <div className="space-y-2">
            <label htmlFor="image-file" className="block text-sm font-medium text-rose-900">
              Изображение
            </label>
            <input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={(event) => {
                void handleImageUpload(event);
              }}
              className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800 file:mr-3 file:rounded-md file:border-0 file:bg-rose-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-rose-700 hover:file:bg-rose-200"
            />
            {uploadStatus ? (
              <p
                className={`text-xs ${
                  uploadStatus.tone === 'success' ? 'text-emerald-700' : 'text-rose-700'
                }`}
                role="status"
                aria-live="polite"
              >
                {uploadStatus.text}
              </p>
            ) : null}
            {imageUrl ? (
              <p className="text-xs text-slate-500">Изображение выбрано и будет сохранено в хотелке.</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isImageUploading}
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
          isReadOnly={!canManageWishlist}
          isPublicView={isPublicView}
          canManageWishlist={canManageWishlist}
          onReserve={handleReserve}
          onUnreserve={handleUnreserve}
          sessionReservedItemIds={sessionReservedItemIds}
        />
      )}
    </AppShell>
  );
}
