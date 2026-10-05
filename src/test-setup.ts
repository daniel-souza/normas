/** jsdom não implementa media queries. A integração visual é validada em Chromium. */
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => {
      const events = new EventTarget();
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: (listener) => events.addEventListener('change', listener as EventListener),
        removeListener: (listener) =>
          events.removeEventListener('change', listener as EventListener),
        addEventListener: events.addEventListener.bind(events),
        removeEventListener: events.removeEventListener.bind(events),
        dispatchEvent: events.dispatchEvent.bind(events),
      };
    },
  });
}

/** Reflexão do atributo `part`, ausente no jsdom e utilizado pelos Web Components. */
if (!('part' in Element.prototype)) {
  const listas = new WeakMap<Element, DOMTokenList>();
  Object.defineProperty(Element.prototype, 'part', {
    configurable: true,
    get(this: Element): DOMTokenList {
      let lista = listas.get(this);
      if (!lista) {
        const tokens = document.createElement('span').classList;
        const element = this;
        lista = new Proxy(tokens, {
          get(target, property) {
            const value = Reflect.get(target, property, target);
            if (typeof value !== 'function') return value;
            return (...args: unknown[]) => {
              const result = value.apply(target, args);
              element.setAttribute('part', target.value);
              return result;
            };
          },
          set(target, property, value) {
            Reflect.set(target, property, value, target);
            element.setAttribute('part', target.value);
            return true;
          },
        });
        listas.set(this, lista);
      }
      lista.value = this.getAttribute('part') ?? '';
      return lista;
    },
  });
}
