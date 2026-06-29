import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';

/**
 * Configure Amplify with generated outputs.
 * Call this once at app startup (main.tsx).
 */
export function configureAmplify() {
  Amplify.configure(outputs as any);
}
