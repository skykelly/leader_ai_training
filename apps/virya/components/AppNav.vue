<template>
  <header class="nav">
    <p class="logo display">AEOLIA<span class="dot">.</span></p>
    <MagneticButton class="nav-btn">Get in touch</MagneticButton>
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
  color: #fff;
  mix-blend-mode: difference;
}

.dot {
  color: var(--amber);
}

.nav-btn {
  padding: 0.55rem 1.3rem;
  font-size: var(--text-sm);
  background: #fff;
  color: #10241d;
}

.nav-btn:hover {
  background: var(--amber);
}
</style>
