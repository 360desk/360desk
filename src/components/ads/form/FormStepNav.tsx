"use client";

interface FormStep {
  id: string;
  label: string;
}

interface FormStepNavProps {
  steps: FormStep[];
  activeStep: string;
  onStepClick: (id: string) => void;
}

export function FormStepNav({
  steps,
  activeStep,
  onStepClick,
}: FormStepNavProps) {
  const activeIndex = steps.findIndex((s) => s.id === activeStep);

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-lg border border-cream/10 bg-charcoal-light p-1">
      {steps.map((step, index) => {
        const isActive = step.id === activeStep;
        const isPast = index < activeIndex;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick(step.id)}
            className={`flex-1 min-w-[100px] rounded-md px-3 py-2.5 text-xs font-medium transition-all whitespace-nowrap ${
              isActive
                ? "bg-primary text-cream shadow-lg shadow-primary/20"
                : isPast
                  ? "text-cream/70 hover:bg-cream/5"
                  : "text-cream/40 hover:text-cream/60 hover:bg-cream/5"
            }`}
          >
            <span className="mr-1.5 opacity-60">{index + 1}.</span>
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}
