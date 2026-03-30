type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="mb-4 space-y-1 sm:mb-6">
      <h2 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      {subtitle ? <p className="text-sm text-slate-500 sm:text-base">{subtitle}</p> : null}
    </div>
  );
}
