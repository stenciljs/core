let _registry: CustomElementRegistry | undefined;

export const setRegistry = (registry: CustomElementRegistry): void => {
  _registry = registry;
};

export const getRegistry = (): CustomElementRegistry => _registry ?? customElements;
