type SearchInputProps = {
  defaultValue?: string;
};

export function SearchInput({ defaultValue = "" }: SearchInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="q" className="text-sm font-medium text-slate-700">
        Search
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search company or role"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}
