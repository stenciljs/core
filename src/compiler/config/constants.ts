import type * as d from '../../declarations';

type DefaultTargetComponentConfig = d.Config['docs']['markdown']['targetComponent'];

export const DEFAULT_DEV_MODE = false;
export const DEFAULT_HASHED_FILENAME_LENGTH = 8;
export const MIN_HASHED_FILENAME_LENGTH = 4;
export const MAX_HASHED_FILENAME_LENGTH = 32;
export const DEFAULT_NAMESPACE = 'App';
export const DEFAULT_TARGET_COMPONENT_STYLES: DefaultTargetComponentConfig = {
  background: '#f9f',
  textColor: '#333',
};
