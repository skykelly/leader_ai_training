<template>
  <header class="nav">
    <NuxtLink to="/" class="logo display">Pioneer<span class="star">*</span></NuxtLink>
    <NuxtLink to="/experience" class="nav-cta eyebrow">Start the experience</NuxtLink>
  </header>
</template>

<style scoped>
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  mix-blend-mode: difference;
}

.logo {
  font-size: 1.1rem;
  letter-spacing: 0.02em;
}

.star {
  color: var(--accent-a);
}

.nav-cta {
  color: var(--ink);
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.2em;
  transition: border-color 0.3s var(--ease-out);
}

.nav-cta:hover {
  border-color: var(--ink);
}
</style>
