import env from "../env";

export const getPublicImage = (key: string) => {
  return `https://${env.R2_PUBLIC_HOST_URL}/${key}`;
};
