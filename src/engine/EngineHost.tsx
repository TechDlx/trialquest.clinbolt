import type { MainPathConfig } from '@/content/types';
import { Allocator } from './engines/Allocator';
import { Branching } from './engines/Branching';
import { BucketSort } from './engines/BucketSort';
import { Builder } from './engines/Builder';
import { DashManager } from './engines/DashManager';
import { Impostor } from './engines/Impostor';
import { MatchPairs } from './engines/MatchPairs';
import { SequenceSort } from './engines/SequenceSort';
import type { EngineProps } from './engines/types';

/** Maps a main-path config to its engine component. quiz-blitz is hosted separately (Test Yourself). */
export function EngineHost(props: EngineProps<MainPathConfig>) {
  const { config } = props;
  switch (config.engine) {
    case 'bucket-sort':
      return <BucketSort {...props} config={config} />;
    case 'builder':
      return <Builder {...props} config={config} />;
    case 'branching-scenario':
      return <Branching {...props} config={config} />;
    case 'spot-the-impostor':
      return <Impostor {...props} config={config} />;
    case 'allocator':
      return <Allocator {...props} config={config} />;
    case 'sequence-sort':
      return <SequenceSort {...props} config={config} />;
    case 'match-pairs':
      return <MatchPairs {...props} config={config} />;
    case 'dash-manager':
      return <DashManager {...props} config={config} />;
  }
}

/** Seconds a config wants, or undefined for untimed (branching-scenario). */
export function configSeconds(config: MainPathConfig): number | undefined {
  return 'seconds' in config ? config.seconds : undefined;
}
