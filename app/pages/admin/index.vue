<template>
  <div>
    <div class="lp-topbar">
      <div class="lp-container" style="display:flex;align-items:center;justify-content:space-between;">
        <NuxtLink to="/admin" style="font-weight:700;color:var(--t1);text-decoration:none;display:flex;align-items:center;gap:8px;">
          🍚 <span class="lp-gradient-text">Lunch Payment</span>
        </NuxtLink>
        <div style="display:flex;align-items:center;gap:8px;">
          <NuxtLink to="/admin/bills" class="lp-btn lp-btn-ghost lp-btn-sm">📋 Bills</NuxtLink>
          <button @click="logout" class="lp-btn lp-btn-ghost lp-btn-sm" style="color:var(--t3);">Đăng xuất</button>
        </div>
      </div>
    </div>

    <div class="lp-container" style="padding:32px 16px; max-width: 1200px;">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:24px;display:flex;align-items:center;gap:10px;">
        <span style="width:32px;height:32px;border-radius:10px;background:var(--accentBg);display:flex;align-items:center;justify-content:center;font-size:16px;">📸</span>
        Tạo Bill mới
      </h2>

      <div class="grid md:grid-cols-12 gap-6 items-start">
        <!-- Left: Upload & Image Box -->
        <div class="md:col-span-5 flex flex-col gap-4">
          <div class="lp-card lp-fade" style="padding:28px;">
            <!-- Upload -->
            <div @click="triggerUpload" @drop.prevent="handleDrop" @dragover.prevent
              style="border:2px dashed var(--border2);border-radius:20px;padding:36px;text-align:center;cursor:pointer;transition:all 0.3s;"
              @mouseenter="$event.currentTarget.style.borderColor='var(--accent)'"
              @mouseleave="$event.currentTarget.style.borderColor='var(--border2)'">
              <input ref="fileInput" type="file" accept="image/*" multiple style="display:none;" @change="handleFileSelect" />
              <div v-if="images.length === 0">
                <div style="font-size:48px;margin-bottom:16px;">📷</div>
                <p style="color:var(--t2);">Kéo thả hoặc click chọn ảnh bill</p>
                <p style="color:var(--t3);font-size:12px;margin-top:6px;">Hỗ trợ JPG, PNG (có thể chọn nhiều ảnh)</p>
              </div>
              <div v-else style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">
                <div v-for="(img, idx) in images" :key="idx" style="position:relative;">
                  <img :src="img.preview" alt="" style="height:120px;border-radius:12px;object-fit:cover;" />
                  <button @click.stop="removeImage(idx)" style="position:absolute;top:-8px;right:-8px;background:var(--red);color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:12px;line-height:1;">×</button>
                </div>
                <p style="width:100%;color:var(--t3);font-size:12px;margin-top:12px;">Click để thêm ảnh</p>
              </div>
            </div>

            <button v-if="images.length > 0" @click="analyzeBill" :disabled="analyzing" class="lp-btn lp-btn-primary" style="width:100%;margin-top:20px;">
              <span v-if="analyzing" class="lp-spinner"></span>
              {{ analyzing ? 'Đang phân tích...' : '🤖 Phân tích với AI' }}
            </button>
          </div>
        </div>

        <!-- Right: Results & Success -->
        <div class="md:col-span-7" v-if="extractedBill || createdBillUrl">
          <div class="lp-card lp-fade" style="padding:28px;">
            <!-- AI Results -->
            <div v-if="extractedBill" style="display:flex;flex-direction:column;gap:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:16px;font-weight:700;color:var(--t1);">📝 Kết quả quét AI</span>
                <span style="font-size:12px;color:var(--t3);">Chỉnh sửa nếu cần</span>
              </div>
              <input v-model="extractedBill.title" class="lp-input" placeholder="Tiêu đề" />
              <div v-for="(item, i) in extractedBill.items" :key="i" style="display:flex;align-items:center;gap:12px;">
                <input v-model="item.name" class="lp-input" style="flex:1;" placeholder="Tên" />
                <input v-model.number="item.amount" type="number" class="lp-input" style="width:140px;" placeholder="Số tiền" />
                <button @click="extractedBill!.items.splice(i, 1)" style="color:var(--t3);background:none;border:none;cursor:pointer;font-size:24px;padding:4px;line-height:1;">×</button>
              </div>
              <button @click="extractedBill!.items.push({ name: '', amount: 0 })" class="lp-btn lp-btn-ghost" style="width:100%;border-style:dashed;">+ Thêm người</button>

              <div class="lp-divider" style="padding-top:20px;margin-top:4px;display:flex;justify-content:space-between;align-items:center;">
                <span style="color:var(--t2);font-weight:600;">Tổng cộng:</span>
                <span class="lp-gradient-text" style="font-size:26px;font-weight:800;">{{ formatMoney(computedTotal) }}</span>
              </div>

              <button @click="saveBill" :disabled="saving" class="lp-btn lp-btn-success" style="width:100%;margin-top:8px;">
                <span v-if="saving" class="lp-spinner"></span>
                {{ saving ? 'Đang lưu...' : '✅ Lưu Bill' }}
              </button>
            </div>

            <!-- Success -->
            <div v-if="createdBillUrl" class="lp-fade" style="padding:20px;border-radius:16px;background:var(--greenBg);border:1px solid rgba(52,211,153,0.15);">
              <p style="font-size:16px;font-weight:700;color:var(--green);margin-bottom:12px;">✅ Tạo bill thành công!</p>
              <div style="display:flex;gap:8px;">
                <input :value="createdBillUrl" readonly class="lp-input" style="flex:1;font-size:14px;" />
                <button @click="copyLink(createdBillUrl!)" class="lp-btn lp-btn-ghost">{{ copied ? '✅' : '📋 Copy' }}</button>
              </div>
              <NuxtLink :to="`/admin/bills/${createdBillId}`" style="color:var(--accent2);font-size:14px;font-weight:600;margin-top:16px;display:inline-block;text-decoration:none;">
                Xem chi tiết bill →
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ExtractedBill { title: string; items: Array<{ name: string; amount: number }>; totalAmount: number; }
const router = useRouter();
const fileInput = ref<HTMLInputElement | null>(null);
const images = ref<{ preview: string; base64: string; mimeType: string }[]>([]);
const analyzing = ref(false); const saving = ref(false);
const extractedBill = ref<ExtractedBill | null>(null);
const createdBillUrl = ref<string | null>(null); const createdBillId = ref<string | null>(null); const copied = ref(false);
onMounted(async () => { try { await $fetch('/api/admin/check'); } catch { router.push('/admin/login'); } });
const computedTotal = computed(() => extractedBill.value?.items.reduce((s, i) => s + (i.amount || 0), 0) || 0);

function triggerUpload() { fileInput.value?.click(); }
function handleFileSelect(e: Event) { const files = (e.target as HTMLInputElement).files; if (files) processFiles(files); }
function handleDrop(e: DragEvent) { const files = e.dataTransfer?.files; if (files) processFiles(files); }

function processFiles(files: FileList) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = (e) => {
      images.value.push({
        preview: e.target?.result as string,
        base64: (e.target?.result as string).split(',')[1],
        mimeType: file.type || 'image/jpeg'
      });
    };
    r.readAsDataURL(file);
  });
  extractedBill.value = null; createdBillUrl.value = null;
}

function removeImage(idx: number) { images.value.splice(idx, 1); }

async function analyzeBill() {
  if (images.value.length === 0) return; analyzing.value = true;
  try { extractedBill.value = await $fetch<ExtractedBill>('/api/admin/analyze', { method: 'POST', body: { images: images.value } }); }
  catch (e: any) { alert('Lỗi: ' + (e.data?.statusMessage || e.message)); } finally { analyzing.value = false; }
}

async function saveBill() {
  if (!extractedBill.value) return; saving.value = true;
  try {
    const r = await $fetch<{ billId: string; publicUrl: string }>('/api/admin/bills', {
      method: 'POST',
      body: { images: images.value, manualItems: { title: extractedBill.value.title, items: extractedBill.value.items, totalAmount: computedTotal.value } }
    });
    createdBillUrl.value = r.publicUrl; createdBillId.value = r.billId; images.value = []; extractedBill.value = null;
  } catch (e: any) { alert('Lỗi: ' + (e.data?.statusMessage || e.message)); } finally { saving.value = false; }
}

function copyLink(url: string) { navigator.clipboard.writeText(url); copied.value = true; setTimeout(() => (copied.value = false), 2000); }
async function logout() { await $fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); }
function formatMoney(n: number) { return new Intl.NumberFormat('vi-VN').format(n) + 'đ'; }
</script>
