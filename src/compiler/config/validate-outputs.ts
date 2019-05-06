import * as d from '../../declarations';
import { validateOutputStats } from './validate-output-stats';
import { validateOutputTargetDist } from './validate-outputs-dist';
import { validateOutputTargetDistHydrateScript } from './validate-outputs-hydrate-script';
import { validateOutputTargetWww } from './validate-outputs-www';
import { validateOutputTargetDistModule } from './validate-outputs-dist-module';
import { validateOutputTargetAngular } from './validate-outputs-angular';
import { validateDocs } from './validate-docs';
import { VALID_TYPES, WWW } from '../output-targets/output-utils';


export function validateOutputTargets(config: d.Config) {

  // setup outputTargets from deprecated config properties
  if (Array.isArray(config.outputTargets)) {

    config.outputTargets.forEach(outputTarget => {
      if (typeof outputTarget.type !== 'string') {
        outputTarget.type = WWW;
      }

      outputTarget.type = outputTarget.type.trim().toLowerCase() as any;

      if (!VALID_TYPES.includes(outputTarget.type)) {
        throw new Error(`invalid outputTarget type "${outputTarget.type}". Valid outputTarget types include: ${VALID_TYPES.map(t => `"${t}"`).join(', ')}`);
      }
    });
  }

  validateOutputTargetWww(config);
  validateOutputTargetDist(config);
  validateOutputTargetAngular(config);
  validateOutputTargetDistHydrateScript(config);
  validateOutputTargetDistModule(config);
  validateDocs(config);
  validateOutputStats(config);


  if (!config.outputTargets || config.outputTargets.length === 0) {
    throw new Error(`outputTarget required`);
  }
}
