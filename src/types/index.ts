export type AppPageProps<
  TParams extends Record<string, string> = Record<string, string>,
> = {
  params: Promise<TParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};
