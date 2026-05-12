function Input({className = "", ...props}) {
  return (
    <input
      className={`text-xs border border-border rounded-sm bg-surface px-3.5 py-2 ${className}`.trim()}
      {...props}
    />
  );
}

export default Input;
