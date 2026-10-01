declare module 'nwsapi' {
  interface NwsapiConfig {
    LOGERRORS?: boolean;
    VERBOSITY?: boolean;
    IDS_DUPES?: boolean;
    MIXEDCASE?: boolean;
    ESCAPECHR?: boolean;
  }

  interface NwsapiInstance {
    configure(config: NwsapiConfig): void;
    match(selector: string, element: unknown, context?: unknown): boolean;
    first(selector: string, context: unknown): unknown | null;
    select(selector: string, context: unknown): unknown[];
    closest(selector: string, element: unknown): unknown | null;
  }

  interface NwsapiGlobal {
    document: unknown;
  }

  function nwsapi(global: NwsapiGlobal): NwsapiInstance;
  export default nwsapi;
}
