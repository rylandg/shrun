import { logger } from './logger';

export interface ShrunConfig {
  imageName: string;
  envVars: string[];
};

export const getConfig = (): ShrunConfig => {
  const imageName = process.env.SHRUN_INTERNAL_SPECIFIER_IMAGE_NAME;
  if (!imageName) {
    throw new Error('No image name provided to Shrun!');
  }
  const unparsedEnvs = process.env.SHRUN_INTERNAL_SPECIFIER_ENV_VARS;
  logger.debug(`unparsed env string ${unparsedEnvs}`);
  let parsedEnvs: string[] = [];
  if (unparsedEnvs) {
    try {
      parsedEnvs = JSON.parse(unparsedEnvs);
      if (!Array.isArray(parsedEnvs)) {
        throw new Error('Envs not provided in array format');
      }
    } catch (err) {
      logger.debug(err);
    }
  }
  return {
    imageName,
    envVars: parsedEnvs,
  };
};
