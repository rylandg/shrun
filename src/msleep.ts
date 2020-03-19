/**
 * Imitates stdc sleep behavior using es6 async/await
  */
export const msleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
