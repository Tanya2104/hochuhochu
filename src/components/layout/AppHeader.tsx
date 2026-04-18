type AppHeaderProps = {
  isPublicView?: boolean;
};

export function AppHeader({ isPublicView = false }: AppHeaderProps) {
  return (
    <header className="mb-6 text-center sm:mb-10">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">ХочуХочу</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm font-medium text-slate-500 sm:max-w-none sm:text-base">
        {isPublicView ? 'Wishlist Ксюши для друзей' : 'Wishlist Ксюши'}
      </p>
    </header>
  );
}
