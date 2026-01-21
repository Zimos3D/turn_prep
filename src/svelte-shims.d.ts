/**
 * TypeScript declarations for .svelte files
 * 
 * Since we're not compiling .svelte files in our build,
 * we just declare them as any component type that can be
 * passed to Tidy5e's mount function.
 */

declare module '*.svelte' {
  const component: any;
  export default component;
}
