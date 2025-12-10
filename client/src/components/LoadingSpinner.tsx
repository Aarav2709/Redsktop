interface Props {
  label?: string;
}

const LoadingSpinner = ({ label }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" aria-hidden />
      {label && <p className="text-xs font-medium text-secondary uppercase tracking-wide">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;
