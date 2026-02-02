declare type EventName =
  | 'initialized'
  | 'context.initialized'
  | 'context.changed'
  | 'context.value.removed'
  | 'context.value.added'
  | 'context.value.changed'
  | 'context.destroyed'
  | 'genome.request.sent'
  | 'config.request.sent'
  | 'genome.request.received'
  | 'config.request.received'
  | 'request.failed'
  | 'genome.updated'
  | 'config.updated'
  | 'effective.genome.updated'
  | 'store.destroyed'
  | 'confirmed'
  | 'contaminated'
  | 'event.emitted';

declare type Listener = (event: string, ...args: any[]) => void;

export class MiniPromise<T = any> extends Promise<T> {
  static createPromise<T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): MiniPromise<T>;
}

declare interface SubscribablePromise<T = any> extends Promise<T> {
  listen(handler: (value: T) => void): () => void;
}

export interface EvolvClientOptions {
  environment: string;
  endpoint?: string;
  lazyUid?: boolean;
  requireConsent?: boolean;
  js?: boolean;
  css?: boolean;
  pushstate?: boolean;
  version?: number;
  autoConfirm?: boolean;
  bufferEvents?: boolean;
  clientName?: string;
  clientType?: 'direct' | 'proxied';
  uid?: string;
  sid?: string;
  useCookies?: boolean;
  timeout?: number;
  hooks?: {};
  pollForTimeUpdates? : boolean;
  profileId?: string;
}

export class EvolvClient {
  context: EvolvContext;
  environment: string;

  constructor(options: Partial<EvolvClientOptions>);

  preload(prefixed: string[], configOnly?: boolean, immediate?: boolean): void;

  get<T = any>(key: string): SubscribablePromise<T | Error>;

  on(topic: EventName, listener: Listener): void;

  once(topic: EventName, listener: Listener): void;

  off(topic: EventName, listener: Listener): void;

  initialize(uid: string, remoteContext?: Record<string, any>, localContext?: Record<string, any>): void;

  confirm(): void;

  contaminate(details?: Record<string, any>, allExperiments?: boolean): void;

  emit(type: string, metadata?: Record<string, any>, flush?: boolean): void;

  isActive(key: string): SubscribablePromise<boolean>;

  getActiveKeys(prefix?: string): SubscribablePromise<{ current: string[]; previous: string[] }>;

  /** @deprecated */
  clearActiveKeys(prefix?: string): void;

  reevaluateContext(): void;

  getConfig(key: string): SubscribablePromise<any>;

  getDisplayName(): SubscribablePromise<string>;

  getEnvConfig(key: string): SubscribablePromise<any>;

  flush(): void;

  allowEvents(): void;

  destroy(): void;
}

interface Allocation {
  uid: string;
  eid: string;
  cid: string;
  ordinal: number;
  group_id: string;
  excluded: boolean;
}

interface Confirmation {
  cid: string;
  timestamp: number;
}

// TODO: Import types from Participants API
/* Represents context that comes from Participants API via the /configuration.json endpoint */
export interface ParticipantsApiContext extends Record<string, any> {
  device: string;
  location: string;
  platform: string;
  geo: {
    city: string;
    country: string;
    lat: string;
    lon: string;
    metro: string;
    postal: string;
    region: string;
    tz: string;
  };
  timestamp: number;
}

export interface RemoteContext extends ParticipantsApiContext {
  confirmations: Confirmation[];
  keys: { active: string };
  variants: { active: string[] };
  experiments: {
    allocations: Allocation[];
    confirmations: Confirmation[];
    exclusions: any[];
  };
}

export interface WebRemoteContext extends RemoteContext {
  web: {
    client: {
      browser: string;
    };
    url: string;
  };
  webloader: {
    js: boolean;
    css: boolean;
  }
}

export interface LocalContext extends Record<string, any> {}

export type StorageType = 'user' | 'session' | 'none';

export class EvolvContext {
  uid: string;
  remoteContext: RemoteContext | WebRemoteContext;
  localContext: LocalContext;

  initialize(uid: string, remoteContext?: Record<string, any>, localContext?: Record<string, any>): void;
  destroy(): void;
  resolve(): Record<string, any>;
  set(key: string, value: any, local?: boolean): boolean;
  update(updates: Record<string, any>, local?: boolean): void;
  remove(key: string): boolean;
  get<T = any>(key: string): T;
  contains(key: string): boolean;
  pushToArray(key: string, value: any, local?: boolean, limit?: number): boolean;
  configurePersistence(key: string, storageType: StorageType): void;
}

export default EvolvClient;
