type Params = {
  message: string;
  status: number;
  metadata?: any;
};
export const resError = ({ message, status, metadata }: Params) => {
  return {
    success: false,
    status,
    message,
    metadata,
  };
};
