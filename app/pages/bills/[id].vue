<template>
  <div>
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;min-height:100vh;"><div class="lp-spinner lp-spinner-lg"></div></div>
    <div v-else-if="error" style="display:flex;align-items:center;justify-content:center;min-height:100vh;"><div style="text-align:center;"><div style="font-size:56px;margin-bottom:12px;">😵</div><p style="color:var(--t3);">Bill không tồn tại</p></div></div>

    <div v-else-if="bill" class="lp-container lp-fade" style="padding:32px 16px; max-width: 900px;">
      <div class="grid md:grid-cols-12 gap-6 items-start">
        <!-- Left Column: Stats & Image -->
        <div class="md:col-span-5 flex flex-col gap-4">
          <!-- Header -->
          <div class="lp-card" style="padding:24px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
              <div class="lp-float" style="font-size:32px;">🍚</div>
              <div>
                <h1 style="font-size:18px;font-weight:700;">{{ bill.title }}</h1>
                <p style="color:var(--t3);font-size:12px;">{{ formatDate(bill.createdAt) }}</p>
              </div>
            </div>

            <div style="margin-bottom:6px;display:flex;justify-content:space-between;font-size:12px;color:var(--t3);">
              <span>{{ paidCount }}/{{ bill.items.length }} đã thanh toán</span>
              <span>{{ Math.round(paidPercent) }}%</span>
            </div>
            <div class="lp-progress-track"><div :class="paidPercent === 100 ? 'lp-progress-bar lp-progress-done' : 'lp-progress-bar'" :style="{ width: paidPercent + '%' }"></div></div>
          </div>

          <!-- Image -->
          <div v-if="parsedImages.length > 0" class="lp-card" style="padding:12px;">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <img v-for="(img, idx) in parsedImages" :key="idx" :src="img" alt="" style="width:100%;border-radius:14px;cursor:pointer;transition:max-height 0.3s;"
                :style="showImg ? '' : 'max-height:140px;object-fit:cover;'" @click="showImg = !showImg" />
            </div>
            <p style="color:var(--t3);font-size:11px;text-align:center;margin-top:6px;">{{ showImg ? 'Thu nhỏ' : 'Xem đầy đủ' }}</p>
          </div>
        </div>

        <!-- Right Column: Detail List -->
        <div class="md:col-span-7">
          <div class="lp-card" style="overflow:hidden;">
            <div v-for="(item, i) in bill.items" :key="item.id"
              :style="{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', animationDelay: i * 50 + 'ms', background: item.paymentStatus === 'paid' ? 'rgba(52,211,153,0.03)' : 'transparent' }">
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="lp-avatar" :style="item.paymentStatus === 'paid' ? 'background:var(--greenBg);color:var(--green)' : 'background:var(--accentBg);color:var(--accent2)'">
                  {{ item.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p style="font-weight:600;font-size:14px;">{{ item.name }}</p>
                  <span :class="item.paymentStatus === 'paid' ? 'lp-badge lp-badge-paid' : 'lp-badge lp-badge-pending'">
                    {{ item.paymentStatus === 'paid' ? '✅ Đã TT' : '⏳ Chờ TT' }}
                  </span>
                </div>
              </div>
              <div style="text-align:right;">
                <p style="font-weight:700;font-size:14px;">{{ formatMoney(item.amount) }}</p>
                <button v-if="item.paymentStatus !== 'paid'" @click="openPay(item)" class="lp-btn lp-btn-primary" style="margin-top:8px;padding:5px 14px;font-size:12px;border-radius:10px;">
                  💳 Thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p style="text-align:center;color:var(--t3);font-size:12px;margin-top:32px;">Powered by 🍚 Lunch Payment</p>
    </div>

    <!-- Payment Modal -->
    <div v-if="payModal" class="lp-overlay" @click.self="closePay">
      <div class="lp-modal" style="text-align:center;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="font-weight:700;font-size:18px;">💳 Thanh toán</h3>
          <button @click="closePay" style="background:none;border:none;color:var(--t3);font-size:22px;cursor:pointer;">×</button>
        </div>

        <div v-if="payLoading" style="padding:40px 0;">
          <div class="lp-spinner lp-spinner-lg" style="margin:0 auto 16px;"></div>
          <p style="color:var(--t3);font-size:14px;">Đang tạo mã QR...</p>
        </div>

        <div v-else-if="payData">
          <p style="color:var(--t2);font-size:14px;margin-bottom:16px;">{{ payItem?.name }}</p>
          <div style="background:#fff;border-radius:20px;padding:16px;display:inline-block;margin-bottom:16px;">
            <img :src="payData.qrCode" alt="QR" style="width:210px;height:210px;" />
          </div>
          <div class="lp-gradient-text" style="font-size:28px;font-weight:800;margin-bottom:8px;">{{ formatMoney(payItem?.amount || 0) }}</div>
          <p style="color:var(--t3);font-size:13px;">Quét mã QR bằng app ngân hàng</p>
        </div>

        <div v-else-if="payError" style="padding:24px 0;">
          <p style="color:var(--red);font-size:14px;margin-bottom:16px;">{{ payError }}</p>
          <button @click="openPay(payItem!)" class="lp-btn lp-btn-ghost lp-btn-sm">Thử lại</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BillItem { id: number; billId: string; name: string; amount: number; paymentStatus: string; paidAt: string | null; }
interface Bill { id: string; title: string; imageData: string | null; totalAmount: number; createdAt: string; items: BillItem[]; }
interface PayResult { checkoutUrl: string; qrCode: string; orderCode: number; }

const route = useRoute(); const billId = route.params.id as string;
const bill = ref<Bill | null>(null); const loading = ref(true); const error = ref(false); const showImg = ref(false);
useHead({ title: computed(() => bill.value ? `${bill.value.title} - Lunch Payment` : 'Thanh toán Bill - Lunch Payment') });
const payModal = ref(false); const payLoading = ref(false); const payData = ref<PayResult | null>(null);
const payError = ref(''); const payItem = ref<BillItem | null>(null);
const paidCount = computed(() => bill.value?.items?.filter(i => i.paymentStatus === 'paid').length || 0);
const paidPercent = computed(() => !bill.value?.items?.length ? 0 : (paidCount.value / bill.value.items.length) * 100);
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

async function fetchBill(includeImage = false) {
  try {
    const nextBill = await $fetch<Bill>(`/api/bills/${billId}`, {
      query: includeImage ? { includeImage: '1' } : undefined,
    });
    if (!includeImage && bill.value?.imageData && !nextBill.imageData) {
      nextBill.imageData = bill.value.imageData;
    }
    bill.value = nextBill;
    error.value = false;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}
onMounted(() => { void fetchBill(true); });
onMounted(() => { if (route.query.paid) setTimeout(() => { void fetchBill(); }, 2000); });
let refreshInterval: ReturnType<typeof setInterval>;
onMounted(() => { refreshInterval = setInterval(() => { void fetchBill(); }, 5000); });
onUnmounted(() => clearInterval(refreshInterval));

let payCheckInterval: ReturnType<typeof setInterval> | null = null;
async function openPay(item: BillItem) {
  payItem.value = item; payModal.value = true; payLoading.value = true; payData.value = null; payError.value = '';
  try { payData.value = await $fetch<PayResult>(`/api/bills/${billId}/pay`, { method: 'POST', body: { itemId: item.id } }); startPayCheck(item.id); }
  catch (e: any) { payError.value = e.data?.statusMessage || 'Lỗi tạo thanh toán'; }
  finally { payLoading.value = false; }
}
function startPayCheck(itemId: number) {
  stopPayCheck();
  payCheckInterval = setInterval(async () => {
    try { const r = await $fetch<{ status: string }>(`/api/bills/${billId}/check`, { method: 'POST', body: { itemId } }); if (r.status === 'paid') { stopPayCheck(); await fetchBill(); closePay(); } } catch {}
  }, 3000);
}
function stopPayCheck() { if (payCheckInterval) { clearInterval(payCheckInterval); payCheckInterval = null; } }
function closePay() { stopPayCheck(); payModal.value = false; payData.value = null; payError.value = ''; payItem.value = null; void fetchBill(); }
onUnmounted(() => stopPayCheck());
function formatMoney(n: number) { return new Intl.NumberFormat('vi-VN').format(n) + 'đ'; }
function formatDate(d: string) { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
</script>
