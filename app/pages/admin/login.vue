<template>
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px;">
    <div class="lp-card lp-fade" style="padding:36px;width:100%;max-width:400px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:16px;">🔐</div>
        <h1 style="font-size:24px;font-weight:700;color:var(--t1);">Admin Login</h1>
        <p style="color:var(--t3);font-size:14px;margin-top:8px;">Đăng nhập để quản lý bill cơm trưa</p>
      </div>

      <form @submit.prevent="login" style="display:flex;flex-direction:column;gap:20px;">
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:var(--t2);margin-bottom:8px;">Username</label>
          <input v-model="username" class="lp-input" placeholder="Nhập username..." required />
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:var(--t2);margin-bottom:8px;">Password</label>
          <input v-model="password" type="password" class="lp-input" placeholder="Nhập password..." required />
        </div>

        <div v-if="error" style="text-align:center;padding:10px 16px;border-radius:14px;font-size:14px;background:rgba(248,113,113,0.1);color:var(--red);">{{ error }}</div>

        <button type="submit" class="lp-btn lp-btn-primary" style="width:100%;" :disabled="loading">
          <span v-if="loading" class="lp-spinner"></span>
          <span v-else>Đăng nhập</span>
        </button>

        <NuxtLink to="/" style="text-align:center;color:var(--t3);font-size:14px;text-decoration:none;">
          ← Về trang chủ
        </NuxtLink>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Đăng nhập Admin - Lunch Payment' });
const router = useRouter();
const username = ref(''); const password = ref(''); const error = ref(''); const loading = ref(false);
onMounted(async () => { try { await $fetch('/api/admin/check'); router.push('/admin'); } catch {} });
async function login() {
  loading.value = true; error.value = '';
  try { await $fetch('/api/admin/login', { method: 'POST', body: { username: username.value, password: password.value } }); router.push('/admin'); }
  catch { error.value = 'Sai username hoặc password'; } finally { loading.value = false; }
}
</script>
