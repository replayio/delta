export function safeStringify(value: any, space?: string | number): string {
  const cache: Set<any> = new Set();
  return JSON.stringify(
    value,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (cache.has(value)) {
          // Circular reference found, discard key
          return;
        }

        // Store value in our collection
        cache.add(value);
      }
      return value;
    },
    space
  );
}
