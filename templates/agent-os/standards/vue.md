# Vue/Nuxt Standard

- Use Vue 3 Composition API and `<script setup lang="ts">`.
- Keep data fetching in composables or server routes.
- Keep secrets in server-only runtime config and server routes.
- Never expose secrets through `NUXT_PUBLIC_*`.
- Components must cover loading, error, and empty states.
- Public pages need SEO metadata when relevant.
- Use design tokens instead of arbitrary colors.
