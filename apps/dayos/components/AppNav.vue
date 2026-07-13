<template>
  <header class="nav">
    <p class="logo display">NEXUS<span class="dot">.</span></p>
    <MagneticButton class="nav-btn">Book a demo</MagneticButton>
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
  font-size: 1.15rem;
}

.dot {
  color: var(--core);
}

.nav-btn {
  padding: 0.6rem 1.4rem;
  font-size: var(--text-sm);
}
</style>
