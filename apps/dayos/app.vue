<template>
  <div class="app">
    <OrbitCanvas />
    <AppCursor />
    <AppNav />
    <NuxtPage />
  </div>
</template>

<style>
.app > main {
  position: relative;
  z-index: 1;
}
</style>
