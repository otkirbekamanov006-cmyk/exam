// Barcha elektron xatlar uchun HTML shablonlari; ichki CSS pochta dasturlarida to'g'ri ko'rinishi uchun ishlatiladi.

const escape = (str = '') =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const layout = ({ title, color = '#4f46e5', body }) => `
<!DOCTYPE html>
<html lang="uz">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.06);">
        <tr><td style="background:${color};padding:22px 28px;">
          <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:.3px;">🔎 Topildi</div>
          <div style="color:rgba(255,255,255,.85);font-size:13px;margin-top:4px;">Yo'qolgan buyumlar egasiga qaytadi</div>
        </td></tr>
        <tr><td style="padding:28px;color:#1f2937;font-size:15px;line-height:1.6;">
          <h2 style="margin:0 0 14px;font-size:20px;color:#111827;">${title}</h2>
          ${body}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;text-align:center;">
          Bu xat avtomatik yuborildi, unga javob yozmang.<br>© ${new Date().getFullYear()} Topildi
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const codeBox = (code) => `
  <div style="margin:22px 0;text-align:center;">
    <span style="display:inline-block;padding:14px 26px;font-size:32px;font-weight:700;letter-spacing:10px;color:#111827;background:#eef2ff;border:2px dashed #6366f1;border-radius:10px;">${code}</span>
  </div>`;

const infoCard = (rows) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
    ${rows
      .filter(([, v]) => v)
      .map(
        ([k, v]) => `<tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;width:38%;border-bottom:1px solid #f0f0f0;">${k}</td>
          <td style="padding:10px 14px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;">${escape(v)}</td>
        </tr>`
      )
      .join('')}
  </table>`;

const quote = (text) =>
  text
    ? `<div style="margin:14px 0;padding:12px 16px;border-left:4px solid #6366f1;background:#f5f3ff;color:#374151;font-style:italic;border-radius:0 8px 8px 0;">“${escape(text)}”</div>`
    : '';

module.exports = {
  // 1. Ro'yxatdan o'tish yoki tasdiqlash kodini qayta yuborish
  verifyCode: ({ name, code }) => ({
    subject: 'Topildi — tasdiqlash kodi',
    html: layout({
      title: `Salom, ${escape(name)}! 👋`,
      body: `<p>Topildi platformasida ro'yxatdan o'tganingiz uchun rahmat. Akkauntingizni tasdiqlash uchun quyidagi kodni kiriting:</p>
        ${codeBox(code)}
        <p style="color:#6b7280;font-size:13px;">Kod <b>5 daqiqa</b> amal qiladi. Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.</p>`,
    }),
  }),

  // 2. Parolni tiklash kodi
  resetCode: ({ name, code }) => ({
    subject: 'Topildi — parolni tiklash kodi',
    html: layout({
      title: 'Parolni tiklash',
      color: '#0ea5e9',
      body: `<p>Salom, ${escape(name)}. Parolingizni tiklash uchun so'rov keldi. Quyidagi kodni kiriting:</p>
        ${codeBox(code)}
        <p style="color:#6b7280;font-size:13px;">Kod <b>5 daqiqa</b> amal qiladi. Agar so'rovni siz yubormagan bo'lsangiz, parolingiz xavfsiz — hech narsa qilish shart emas.</p>`,
    }),
  }),

  // 3. To'g'ri javob berilgan da'vo haqida e'lon egasiga xabar
  claimReceived: ({ ownerName, itemTitle, claimantName, message }) => ({
    subject: `«${itemTitle}» e'loningizga da'vo keldi`,
    html: layout({
      title: `«${escape(itemTitle)}» e'loningizga da'vo keldi 📬`,
      color: '#f59e0b',
      body: `<p>Salom, ${escape(ownerName)}! Kimdir siz topgan buyumni o'ziniki deb da'vo qildi va maxfiy savolga <b>to'g'ri javob berdi</b>.</p>
        ${infoCard([['Da\'vogar', claimantName], ['E\'lon', itemTitle]])}
        ${quote(message)}
        <p>Ilovaga kirib da'voni <b>tasdiqlang</b> yoki <b>rad eting</b>. Tasdiqlaganingizdan so'ng ikkalangizga ham bir-biringizning kontaktlari yuboriladi.</p>`,
    }),
  }),

  // 4. Da'vo tasdiqlangani haqida har ikki tomonga xabar
  claimApproved: ({ name, itemTitle, otherRole, otherName, otherPhone }) => ({
    subject: `«${itemTitle}» — da'vo tasdiqlandi`,
    html: layout({
      title: 'Da\'vo tasdiqlandi 🎉',
      color: '#10b981',
      body: `<p>Salom, ${escape(name)}! «<b>${escape(itemTitle)}</b>» bo'yicha da'vo tasdiqlandi. Buyumni topshirish/olish uchun quyidagi inson bilan bog'laning:</p>
        ${infoCard([[otherRole, otherName], ['Telefon', otherPhone]])}
        <p style="color:#6b7280;font-size:13px;">Uchrashuvni gavjum va xavfsiz joyda belgilashni tavsiya qilamiz.</p>`,
    }),
  }),

  // 5. Da'vo rad etilgani haqida da'vogarga xabar
  claimRejected: ({ name, itemTitle }) => ({
    subject: `«${itemTitle}» — da'vo rad etildi`,
    html: layout({
      title: 'Da\'vongiz rad etildi',
      color: '#ef4444',
      body: `<p>Salom, ${escape(name)}. Afsuski, «<b>${escape(itemTitle)}</b>» e'loniga yuborgan da'vongiz e'lon egasi tomonidan rad etildi.</p>
        <p>Agar buyum haqiqatan sizniki bo'lsa, platformadagi boshqa e'lonlarni ham ko'rib chiqing yoki o'zingiz "yo'qotdim" e'lonini joylang.</p>`,
    }),
  }),

  // 6. Buyum topilgani haqida uni yo'qotgan odamga xabar
  itemReported: ({ ownerName, itemTitle, finderName, finderPhone, message }) => ({
    subject: `«${itemTitle}» — kimdir buyumingizni topdi!`,
    html: layout({
      title: 'Buyumingiz topilgan bo\'lishi mumkin! 🙌',
      color: '#8b5cf6',
      body: `<p>Salom, ${escape(ownerName)}! «<b>${escape(itemTitle)}</b>» e'loningizni ko'rgan inson buyumni topganini aytmoqda.</p>
        ${infoCard([['Topgan inson', finderName], ['Telefon', finderPhone]])}
        ${quote(message)}
        <p>U bilan bog'lanib, buyum haqiqatan sizniki ekanini aniqlang.</p>`,
    }),
  }),
};
