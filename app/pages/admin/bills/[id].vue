<template>
  <div>
    <div class="lp-topbar">
      <div class="lp-container" style="display:flex;align-items:center;justify-content:space-between;">
        <NuxtLink to="/admin/bills" style="font-size:14px;color:var(--t2);text-decoration:none;display:flex;align-items:center;gap:6px;">← Bills</NuxtLink>
        <button @click="copyPublicLink" class="lp-btn lp-btn-ghost lp-btn-sm">{{ copied ? '✅ Copied!' : '🔗 Copy Link' }}</button>
      </div>
    </div>

    <div v-if="loading" style="display:flex;justify-content:center;padding:80px 0;"><div class="lp-spinner lp-spinner-lg"></div></div>
    <div v-else-if="error" style="text-align:center;padding:80px 0;"><div style="font-size:48px;margin-bottom:12px;">😵</div><p style="color:var(--t3);">Không tìm thấy bill</p></div>

    <div v-else-if="bill" class="lp-container lp-fade" style="padding:32px 16px; max-width: 1000px;">
      <div class="grid md:grid-cols-12 gap-6 items-start">
        <!-- Left Column: Stats & Image -->
        <div class="md:col-span-5 flex flex-col gap-4">
          <!-- Header -->
          <div class="lp-card" style="padding:28px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
              <div>
                <h1 style="font-size:22px;font-weight:800;">{{ bill.title }}</h1>
                <p style="color:var(--t3);font-size:13px;margin-top:4px;">{{ formatDate(bill.createdAt) }}</p>
              </div>
              <div class="lp-gradient-text" style="font-size:28px;font-weight:800;">{{ formatMoney(bill.totalAmount) }}</div>
            </div>

            <!-- Progress -->
            <div style="margin-bottom:20px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--t3);margin-bottom:6px;">
                <span>Tiến độ thanh toán</span>
                <span>{{ Math.round(paidPercent) }}%</span>
              </div>
              <div class="lp-progress-track" style="height:6px;">
                <div :class="paidPercent === 100 ? 'lp-progress-bar lp-progress-done' : 'lp-progress-bar'" :style="{ width: paidPercent + '%' }"></div>
              </div>
            </div>

            <!-- Stats -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
              <div class="lp-stat-box" style="background:var(--greenBg);">
                <p style="font-size:11px;color:var(--t3);margin-bottom:4px;">Đã thu</p>
                <p style="font-weight:700;color:var(--green);font-size:16px;">{{ formatMoney(paidAmount) }}</p>
              </div>
              <div class="lp-stat-box" style="background:var(--amberBg);">
                <p style="font-size:11px;color:var(--t3);margin-bottom:4px;">Còn lại</p>
                <p style="font-weight:700;color:var(--amber);font-size:16px;">{{ formatMoney(bill.totalAmount - paidAmount) }}</p>
              </div>
              <div class="lp-stat-box" style="background:var(--accentBg);">
                <p style="font-size:11px;color:var(--t3);margin-bottom:4px;">Số người</p>
                <p style="font-weight:700;color:var(--accent2);font-size:16px;">{{ bill.items.length }}</p>
              </div>
            </div>
          </div>

          <div v-if="parsedImages.length > 0" class="lp-card" style="padding:16px;">
            <p style="font-size:13px;color:var(--t3);margin-bottom:8px;">📷 Ảnh gốc ({{ parsedImages.length }})</p>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <img v-for="(img, idx) in parsedImages" :key="idx" :src="img" alt="" style="width:100%;border-radius:16px;" />
            </div>
          </div>
        </div>

        <!-- Right Column: Detail List -->
        <div class="md:col-span-7">
          <!-- Items -->
          <div class="lp-card" style="overflow:hidden;">
            <div style="padding:16px 22px;border-bottom:1px solid var(--border);">
              <h2 style="font-size:14px;font-weight:700;color:var(--t2);">👥 Chi tiết</h2>
            </div>
            <div v-for="item in bill.items" :key="item.id"
              style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);transition:background 0.2s;"
              :style="item.paymentStatus === 'paid' ? 'background:rgba(52,211,153,0.03)' : ''">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="lp-avatar" :style="item.paymentStatus === 'paid' ? 'background:var(--greenBg);color:var(--green)' : 'background:var(--accentBg);color:var(--accent2)'">
                  {{ item.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p style="font-weight:600;font-size:14px;">{{ item.name }}</p>
                  <span :class="item.paymentStatus === 'paid' ? 'lp-badge lp-badge-paid' : 'lp-badge lp-badge-pending'" style="margin-top:2px;">
                    {{ item.paymentStatus === 'paid' ? 'Đã TT' : 'Chờ TT' }}
                  </span>
                </div>
              </div>
              <span style="font-weight:700;font-size:14px;" :style="item.paymentStatus === 'paid' ? 'color:var(--green)' : ''">{{ formatMoney(item.amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BillItem { id: number; name: string; amount: number; paymentStatus: string; paidAt: string | null; }
interface Bill { id: string; title: string; imageData: string | null; totalAmount: number; createdAt: string; items: BillItem[]; }
const route = useRoute(); const router = useRouter(); const config = useRuntimeConfig();
const billId = route.params.id as string;
const bill = ref<Bill | null>(null); const loading = ref(true); const error = ref(false); const copied = ref(false);
const paidCount = computed(() => bill.value?.items?.filter(i => i.paymentStatus === 'paid').length || 0);
const paidPercent = computed(() => !bill.value?.items?.length ? 0 : (paidCount.value / bill.value.items.length) * 100);
const paidAmount = computed(() => bill.value?.items?.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.amount, 0) || 0);
const parsedImages = computed(() => {
  if (!bill.value?.imageData) return [];
  try {
    const parsed = JSON.parse(bill.value.imageData);
    if (Array.isArray(parsed)) return parsed;
    return [bill.value.imageData];
  } catch (e) {
    return [bill.value.imageData];
  }
});
onMounted(async () => { try { await $fetch('/api/admin/check'); } catch { router.push('/admin/login'); return; } await fetchBill(); });
let interval: ReturnType<typeof setInterval>;
onMounted(() => { interval = setInterval(fetchBill, 5000); });
onUnmounted(() => clearInterval(interval));
async function fetchBill() { try { bill.value = await $fetch<Bill>(`/api/bills/${billId}`); } catch { error.value = true; } finally { loading.value = false; } }
function copyPublicLink() { navigator.clipboard.writeText(`${config.public.appUrl}/bills/${billId}`); copied.value = true; setTimeout(() => (copied.value = false), 2000); }
function formatMoney(n: number) { return new Intl.NumberFormat('vi-VN').format(n) + 'đ'; }
function formatDate(d: string) { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
</script>
