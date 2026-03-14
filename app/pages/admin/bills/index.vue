<template>
  <div>
    <div class="lp-topbar">
      <div class="lp-container" style="display:flex;align-items:center;justify-content:space-between;">
        <NuxtLink to="/admin" style="font-weight:700;color:var(--t1);text-decoration:none;display:flex;align-items:center;gap:8px;">
          🍚 <span class="lp-gradient-text">Lunch Payment</span>
        </NuxtLink>
        <div style="display:flex;align-items:center;gap:8px;">
          <NuxtLink to="/admin" class="lp-btn lp-btn-primary lp-btn-sm">➕ Tạo mới</NuxtLink>
          <button @click="logout" class="lp-btn lp-btn-ghost lp-btn-sm" style="color:var(--t3);">Đăng xuất</button>
        </div>
      </div>
    </div>

    <div class="lp-container" style="padding:32px 16px; max-width: 1200px;">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:24px;display:flex;align-items:center;gap:10px;">
        <span style="width:32px;height:32px;border-radius:10px;background:var(--accentBg);display:flex;align-items:center;justify-content:center;font-size:16px;">📋</span>
        Danh sách Bills
      </h2>

      <div v-if="loading" style="display:flex;justify-content:center;padding:80px 0;">
        <div class="lp-spinner lp-spinner-lg"></div>
      </div>

      <div v-else-if="bills.length === 0" class="lp-fade" style="text-align:center;padding:80px 0;">
        <div style="font-size:56px;margin-bottom:16px;">📭</div>
        <p style="color:var(--t3);margin-bottom:20px;">Chưa có bill nào</p>
        <NuxtLink to="/admin" class="lp-btn lp-btn-primary">➕ Tạo Bill</NuxtLink>
      </div>

      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink v-for="(bill, i) in bills" :key="bill.id" :to="`/admin/bills/${bill.id}`"
          class="lp-card lp-card-hover lp-fade" :style="{ padding: '22px', textDecoration: 'none', color: 'inherit', animationDelay: i * 60 + 'ms' }">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
            <div>
              <h3 style="font-weight:700;font-size:16px;">{{ bill.title }}</h3>
              <p style="color:var(--t3);font-size:12px;margin-top:4px;">{{ formatDate(bill.createdAt) }} · {{ bill.items.length }} người</p>
            </div>
            <div style="text-align:right;">
              <p class="lp-gradient-text" style="font-size:20px;font-weight:800;">{{ formatMoney(bill.totalAmount) }}</p>
              <span v-if="getPaid(bill) === bill.items.length" class="lp-badge lp-badge-paid" style="margin-top:6px;">✅ Hoàn tất</span>
              <span v-else class="lp-badge lp-badge-pending" style="margin-top:6px;">{{ getPaid(bill) }}/{{ bill.items.length }}</span>
            </div>
          </div>
          <div class="lp-progress-track">
            <div :class="getPaid(bill) === bill.items.length ? 'lp-progress-bar lp-progress-done' : 'lp-progress-bar'"
              :style="{ width: (bill.items.length ? getPaid(bill) / bill.items.length * 100 : 0) + '%' }"></div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">
            <span v-for="item in bill.items" :key="item.id"
              :style="{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', fontWeight: 600,
                background: item.paymentStatus === 'paid' ? 'var(--greenBg)' : 'rgba(255,255,255,0.04)',
                color: item.paymentStatus === 'paid' ? 'var(--green)' : 'var(--t3)' }">
              {{ item.name }}
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Bill { id: string; title: string; totalAmount: number; createdAt: string;
  items: Array<{ id: number; name: string; amount: number; paymentStatus: string }>; }
const router = useRouter(); const bills = ref<Bill[]>([]); const loading = ref(true);
onMounted(async () => { try { await $fetch('/api/admin/check'); } catch { router.push('/admin/login'); return; } await load(); });
let interval: ReturnType<typeof setInterval>;
onMounted(() => { interval = setInterval(load, 10000); });
onUnmounted(() => clearInterval(interval));
async function load() { try { bills.value = await $fetch<Bill[]>('/api/admin/bills'); } catch {} finally { loading.value = false; } }
function getPaid(b: Bill) { return b.items.filter(i => i.paymentStatus === 'paid').length; }
async function logout() { await $fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); }
function formatMoney(n: number) { return new Intl.NumberFormat('vi-VN').format(n) + 'đ'; }
function formatDate(d: string) { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
</script>
