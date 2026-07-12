<template>
  <header class="nav">
    <p class="logo display">CONDUIT<span class="dot">.</span></p>
    <MagneticButton class="nav-btn">Get started</MagneticButton>
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
  padding: 1.4rem 2rem;
}

.logo {
  font-size: 1.1rem;
  letter-spacing: -0.01em;
}

.dot {
  color: var(--signal);
}

.nav-btn {
  padding: 0.55rem 1.3rem;
  font-size: var(--text-sm);
}
</style>
