<template>
  <div class="card">
    <h1>Welcome to Capacitor Auth Manager Vue Example</h1>
    <p>
      This Vue 3 example demonstrates the provider-less authentication system
      using Composition API and Vue composables.
    </p>
    
    <div v-if="isAuthenticated">
      <h2>You're logged in!</h2>
      <p>Welcome back, {{ user?.displayName || user?.email || 'User' }}!</p>
      <router-link to="/profile" class="btn btn-primary">
        View Profile
      </router-link>
    </div>
    <div v-else>
      <h2>Get Started</h2>
      <p>Sign in to access your profile and protected features.</p>
      <router-link to="/login" class="btn btn-primary">
        Sign In
      </router-link>
    </div>
    
    <div style="margin-top: 2rem">
      <h3>Features:</h3>
      <ul>
        <li>✅ No providers or plugins required</li>
        <li>✅ Vue 3 Composition API</li>
        <li>✅ Reactive auth state</li>
        <li>✅ Multiple authentication providers</li>
        <li>✅ TypeScript support</li>
        <li>✅ Route guards</li>
        <li>✅ Persistent sessions</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from 'capacitor-auth-manager/vue'

const { isAuthenticated, user } = useAuth()
</script>