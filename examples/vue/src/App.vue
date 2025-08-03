<template>
  <div id="app">
    <nav class="navbar">
      <div class="navbar-content">
        <router-link
          to="/"
          class="navbar-brand"
        >
          Auth Manager Vue Demo
        </router-link>
        <div class="navbar-nav">
          <router-link
            to="/"
            :class="{ active: $route.path === '/' }"
          >
            Home
          </router-link>
          <template v-if="isAuthenticated">
            <router-link
              to="/profile"
              :class="{ active: $route.path === '/profile' }"
            >
              Profile
            </router-link>
            <span>Hello, {{ user?.displayName || user?.email || 'User' }}</span>
            <button
              @click="handleSignOut"
              class="btn btn-danger"
            >
              Sign Out
            </button>
          </template>
          <router-link
            v-else
            to="/login"
            class="btn btn-primary"
          >
            Sign In
          </router-link>
        </div>
      </div>
    </nav>

    <main class="container">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from 'capacitor-auth-manager/vue';

const { isAuthenticated, user, signOut } = useAuth();

const handleSignOut = async () => {
  try {
    await signOut();
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
</script>
