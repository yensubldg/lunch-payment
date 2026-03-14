<template>
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;">
    <div class="lp-fade" style="text-align:center;">
      <div class="lp-float" style="font-size:72px;margin-bottom:32px;">🍚</div>
      <h1 style="font-size:44px;font-weight:800;margin-bottom:8px;">
        <span class="lp-gradient-text">Lunch Payment</span>
      </h1>
      <p style="color:var(--t3);font-size:18px;margin-bottom:40px;">Tính tiền cơm trưa nhanh gọn</p>
      <NuxtLink to="/admin/login" class="lp-btn lp-btn-primary" style="font-size:16px;padding:14px 32px;">
        Đăng nhập Admin →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Lunch Payment - Thu tiền cơm trưa' });
</script>
