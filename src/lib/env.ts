function getEnvValue(key: string) {
  const value = process.env[key];

  if (!value) {
    return "";
  }

  return value;
}

export const env = {
  DATABASE_URL: getEnvValue("DATABASE_URL"),
};
