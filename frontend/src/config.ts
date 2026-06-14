/**
 * Dynamic API Base URL configuration.
 * Resolves VITE_API_URL from build-time environment variables,
 * falling back to the standard localhost endpoint.
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
