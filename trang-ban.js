/**
 * Nuance — bản bán tối thiểu (AB4). Chép nguyên hàm từ bản chốt
 * mvp-paste/overlay/public/chay/landing.js + landing.html, cắt phần không dùng.
 */
document.addEventListener('DOMContentLoaded', () => {
  const CONFIG = window.NUANCE_CONFIG || {};
  const CHECKOUT_URL = CONFIG.checkoutUrl || '';
  const CHECKOUT_SAN_SANG = typeof CHECKOUT_URL === 'string' && CHECKOUT_URL.indexOf('https://') === 0;

  const btnFounder = document.getElementById('btn-pay-founder');
  const buyNote = document.getElementById('buy-note');
  if (btnFounder) {
    if (CHECKOUT_SAN_SANG) {
      btnFounder.removeAttribute('disabled');
      btnFounder.textContent = 'Buy the Founder Pass';
      if (buyNote) buyNote.style.display = 'none';
    } else {
      btnFounder.setAttribute('disabled', 'disabled');
      btnFounder.textContent = 'Opening soon';
    }

    btnFounder.addEventListener('click', (e) => {
      e.preventDefault();
      if (!CHECKOUT_SAN_SANG) {
        const waitlistForm = document.getElementById('form-vip-waitlist');
        if (waitlistForm) waitlistForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      window.location.assign(CHECKOUT_URL);
    });
  }

  window.NUANCE_CHECKOUT_SAN_SANG = CHECKOUT_SAN_SANG;
});

/* === PHIEU (làn B) === */
(function () {
  const CONFIG = window.NUANCE_CONFIG || {};
  const DIEM_CUOI_RAW = CONFIG.phieuEndpoint || window.DISPLAY_OS_PHIEU_ENDPOINT || '';
  const PHIEU_SAN_SANG = typeof DIEM_CUOI_RAW === 'string' && DIEM_CUOI_RAW.indexOf('https://') === 0;
  const DIEM_CUOI_PHIEU = PHIEU_SAN_SANG ? DIEM_CUOI_RAW : '';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function guiYeuCau(path, body) {
    const r = await fetch(`${DIEM_CUOI_PHIEU}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  function baoSuKien(ten) {
    if (!PHIEU_SAN_SANG) return;
    guiYeuCau('su-kien', { event: ten }).catch(() => {});
  }

  if (PHIEU_SAN_SANG) {
    document.querySelectorAll('[data-cho="waitlist"]').forEach((el) => {
      el.hidden = false;
    });
    const buyNote = document.getElementById('buy-note');
    if (buyNote && buyNote.style.display !== 'none') {
      buyNote.textContent = 'Checkout opens soon. Join the waitlist below to be notified.';
    }
  }

  // 4 sự kiện bấm/điều hướng
  baoSuKien('landing_view');

  document.querySelectorAll('#btn-pay-founder').forEach((btn) => {
    btn.addEventListener('click', () => baoSuKien('click_buy_founder'));
  });

  document.querySelectorAll('.btn-payment-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window.NUANCE_CHECKOUT_SAN_SANG) baoSuKien('checkout_redirect');
    });
  });

  window.NUANCE_PHIEU_GUI_WAITLIST = async function (email, platforms) {
    if (!PHIEU_SAN_SANG) {
      return { ok: false, reason: 'chua_cau_hinh' };
    }
    if (!EMAIL_RE.test(email)) {
      return { ok: false, reason: 'email_khong_hop_le' };
    }
    try {
      const res = await guiYeuCau('waitlist', { email, platforms });
      baoSuKien('waitlist_submit_ok');
      return { ok: true, trung: !!(res && res.trung) };
    } catch (err) {
      return { ok: false, reason: 'mang_loi' };
    }
  };

  window.xuLyDangKyWaitlist = async function (event) {
    if (event) event.preventDefault();
    const input = document.getElementById('waitlist-email-input');
    const website = document.getElementById('waitlist-website');
    const msg = document.getElementById('waitlist-feedback-msg');
    const btn = document.getElementById('btn-submit-waitlist');
    if (!input || !input.value) return;
    const email = input.value.trim();

    // Honeypot dính: lặng lẽ coi như xong, không cho biết đã bị chặn
    if (website && website.value && website.value.trim() !== '') {
      if (msg) { msg.style.display = 'block'; msg.textContent = 'Thanks. You are on the list.'; }
      return;
    }

    if (!window.NUANCE_PHIEU_GUI_WAITLIST) {
      if (msg) { msg.style.display = 'block'; msg.textContent = 'Please check the email address and try again.'; }
      return;
    }

    const ket = await window.NUANCE_PHIEU_GUI_WAITLIST(email, []);

    if (!ket.ok && ket.reason === 'email_khong_hop_le') {
      if (msg) { msg.style.display = 'block'; msg.textContent = 'Please check the email address and try again.'; }
      return;
    }

    if (!ket.ok && ket.reason === 'chua_cau_hinh') {
      if (msg) { msg.style.display = 'block'; msg.textContent = 'Please check the email address and try again.'; }
      return;
    }

    if (!ket.ok && ket.reason === 'mang_loi') {
      if (msg) { msg.style.display = 'block'; msg.textContent = 'Please check the email address and try again.'; }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.7';
    }
    if (msg) {
      msg.style.display = 'block';
      msg.textContent = 'Thanks. You are on the list.';
    }
  };
})();
