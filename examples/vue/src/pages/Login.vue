<template>
  <div
    class="card"
    style="max-width: 400px; margin: 0 auto"
  >
    <h1>Sign In</h1>

    <div
      v-if="error"
      class="error-message"
    >
      {{ error.message }}
    </div>
    <div
      v-if="message"
      :class="message.includes('Failed') ? 'error-message' : 'success-message'"
    >
      {{ message }}
    </div>

    <div style="margin-bottom: 2rem">
      <h3>Social Login</h3>
      <button
        @click="handleSocialSignIn('google')"
        class="btn btn-primary btn-social"
        :disabled="isLoading"
      >
        Sign in with Google
      </button>
      <button
        @click="handleSocialSignIn('github')"
        class="btn btn-primary btn-social"
        :disabled="isLoading"
      >
        Sign in with GitHub
      </button>
      <button
        @click="handleSocialSignIn('facebook')"
        class="btn btn-primary btn-social"
        :disabled="isLoading"
      >
        Sign in with Facebook
      </button>
      <button
        @click="handleSocialSignIn('microsoft')"
        class="btn btn-primary btn-social"
        :disabled="isLoading"
      >
        Sign in with Microsoft
      </button>
    </div>

    <hr style="margin: 2rem 0" />

    <form @submit.prevent="handleEmailAuth">
      <h3>{{ isSignUp ? 'Create Account' : 'Email & Password' }}</h3>

      <div class="form-group">
        <label
          for="email"
          class="form-label"
          >Email</label
        >
        <input
          id="email"
          v-model="email"
          type="email"
          class="form-input"
          placeholder="your@email.com"
          required
          :disabled="isLoading"
        />
      </div>

      <div class="form-group">
        <label
          for="password"
          class="form-label"
          >Password</label
        >
        <input
          id="password"
          v-model="password"
          type="password"
          class="form-input"
          placeholder="••••••••"
          required
          :disabled="isLoading"
        />
      </div>

      <button
        type="submit"
        class="btn btn-primary"
        style="width: 100%"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In' }}
      </button>

      <p style="text-align: center; margin-top: 1rem">
        {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
        {{ ' ' }}
        <button
          type="button"
          @click="isSignUp = !isSignUp"
          style="
            background: none;
            border: none;
            color: #42b883;
            cursor: pointer;
            text-decoration: underline;
          "
          :disabled="isLoading"
        >
          {{ isSignUp ? 'Sign In' : 'Sign Up' }}
        </button>
      </p>
    </form>

    <hr style="margin: 2rem 0" />

    <div>
      <h3>Magic Link</h3>
      <p>Get a sign-in link sent to your email</p>
      <button
        @click="handleMagicLink"
        class="btn btn-primary"
        style="width: 100%"
        :disabled="isLoading || !email"
      >
        Send Magic Link
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from 'capacitor-auth-manager/vue';

const router = useRouter();
const { signIn, signUp, error } = useAuth();

const email = ref('');
const password = ref('');
const isSignUp = ref(false);
const isLoading = ref(false);
const message = ref('');

const handleSocialSignIn = async (provider: string) => {
  try {
    isLoading.value = true;
    message.value = '';
    await signIn(provider);
    router.push('/profile');
  } catch (err) {
    console.error(`${provider} sign in error:`, err);
    message.value = `Failed to sign in with ${provider}`;
  } finally {
    isLoading.value = false;
  }
};

const handleEmailAuth = async () => {
  try {
    isLoading.value = true;
    message.value = '';

    if (isSignUp.value) {
      await signUp({ email: email.value, password: password.value });
      message.value = 'Account created successfully! You can now sign in.';
      isSignUp.value = false;
    } else {
      await signIn('email-password', {
        email: email.value,
        password: password.value,
      });
      router.push('/profile');
    }
  } catch (err) {
    console.error('Email auth error:', err);
    message.value = isSignUp.value
      ? 'Failed to create account'
      : 'Failed to sign in';
  } finally {
    isLoading.value = false;
  }
};

const handleMagicLink = async () => {
  if (!email.value) {
    message.value = 'Please enter your email address';
    return;
  }

  try {
    isLoading.value = true;
    message.value = '';
    await signIn('magic-link', { email: email.value });
    message.value = 'Magic link sent! Check your email.';
  } catch (err) {
    console.error('Magic link error:', err);
    message.value = 'Failed to send magic link';
  } finally {
    isLoading.value = false;
  }
};
</script>
