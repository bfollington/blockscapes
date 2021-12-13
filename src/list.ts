export function choose<T>(l: T[]) {
  return l[Math.floor(Math.random() * l.length)];
}
