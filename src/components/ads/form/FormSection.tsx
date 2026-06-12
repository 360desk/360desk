interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <fieldset className="rounded-xl border border-cream/10 bg-charcoal p-5">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-primary">
        {title}
      </legend>
      {description && (
        <p className="text-xs text-cream/40 mb-4 mt-2">{description}</p>
      )}
      {children}
    </fieldset>
  );
}
