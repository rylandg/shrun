import { logger } from './logger';

export interface ShrunConfig {
  imageName: string;
  envVars: string[];
  volumes: string[];
};

const parseArray = (unparsed?: string): string[] => {
  if (unparsed) {
    logger.debug(`unparsed array string ${unparsed}`);
    try {
      const parsed = JSON.parse(unparsed);
      if (!Array.isArray(parsed)) {
        throw new Error('Envs not provided in array format');
      }
      return parsed;
    } catch (err) {
      logger.debug(err);
    }
  }
  return [];
}

export const getConfig = (): ShrunConfig => {
  const {
    SHRUN_INTERNAL_SPECIFIER_IMAGE_NAME: imageName,
    SHRUN_INTERNAL_SPECIFIER_ENV_VARS: uEnvVars,
    SHRUN_INTERNAL_SPECIFIER_VOLUMES: uVolumes,
  } = process.env;
  if (!imageName) {
    throw new Error('No image name provided to Shrun!');
  }
  const parsedEnvs = parseArray(uEnvVars);
  const parsedVolumes = parseArray(uVolumes);

  return {
    imageName,
    envVars: parsedEnvs,
    volumes: parsedVolumes,
  };
};
