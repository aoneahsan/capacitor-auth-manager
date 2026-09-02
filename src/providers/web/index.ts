// Web provider exports.
//
// WIP: providers ship one at a time (see docs/features/google-provider-production-v3). As of 2.4.1
// only the hardened Google web provider is exported here. The other web providers still exist in this
// folder but are excluded from the published build until each is re-enabled and verified. Re-add a
// provider's export below (and restore its registry loader + remove its tsconfig.build exclude) when
// its turn comes.
export { GoogleAuthProviderWeb } from './google-provider.js';
