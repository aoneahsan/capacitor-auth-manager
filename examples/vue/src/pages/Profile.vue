<template>
  <div class="card">
    <h1>User Profile</h1>
    
    <div class="user-info">
      <h3>User Information</h3>
      <pre>{{ JSON.stringify(user, null, 2) }}</pre>
    </div>

    <div class="user-info">
      <h3>Auth State</h3>
      <pre>{{ JSON.stringify(authState, null, 2) }}</pre>
    </div>

    <div v-if="token" class="user-info">
      <h3>Token Information</h3>
      <p><strong>Token:</strong> {{ token.substring(0, 20) }}...</p>
      <p v-if="expiresAt"><strong>Expires:</strong> {{ new Date(expiresAt).toLocaleString() }}</p>
    </div>

    <h3>Vue Composables Demo</h3>
    <p>This page demonstrates the different Vue composables available:</p>
    <ul>
      <li><code>useAuth()</code> - Main composable with all auth methods</li>
      <li><code>useAuthState()</code> - Just the reactive auth state</li>
      <li><code>useToken()</code> - Access token management</li>
      <li><code>useUser()</code> - Just the user object</li>
    </ul>

    <h3>Reactive State</h3>
    <p>All composables return reactive refs that automatically update when auth state changes:</p>
    <pre>{{ reactiveDemo }}</pre>

    <button @click="handleSignOut" class="btn btn-danger" style="margin-top: 2rem">
      Sign Out
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth, useAuthState, useToken } from 'capacitor-auth-manager/vue'

const router = useRouter()
const { user, signOut } = useAuth()
const authState = useAuthState()
const { token, expiresAt } = useToken()

const reactiveDemo = computed(() => ({
  isAuthenticated: authState.value.isAuthenticated,
  userEmail: user.value?.email,
  hasToken: !!token.value
}))

const handleSignOut = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Sign out error:', error)
  }
}
</script>