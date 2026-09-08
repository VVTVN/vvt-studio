const TPL = {
  1: 'Xưởng SX/B2B',
  2: 'Bất động sản',
  3: 'Dịch vụ',
  4: 'Landing Ads',
  5: 'Nhà hàng/CF',
  6: 'Thời trang'
};

const WORKER_VERSION = '2026-09-08.2';

const SYSTEM_INSTRUCTION = `
Bạn là trợ lý tư vấn của VVT Digital, chuyên làm mới website cũ cho doanh nghiệp.

VVT Digital hỗ trợ giữ dữ liệu có giá trị, nâng cấp hình ảnh sản phẩm, biên tập
nội dung bán hàng và dựng lại giao diện, tốc độ, trải nghiệm trên điện thoại.

Quy tắc:
- Trả lời bằng tiếng Việt, tự nhiên, điềm tĩnh như một người tư vấn thật.
- Mỗi câu trả lời thường chỉ 1-3 câu và không quá 45 từ.
- Khách chỉ chào hỏi: đáp đúng một câu ngắn, rồi mời gửi website nếu phù hợp.
- Không nhắc lại VVT Digital làm gì trừ khi khách hỏi.
- Không đọc danh sách dịch vụ, không đưa menu lựa chọn, không dùng Markdown đậm.
- Trả lời thẳng điều khách vừa nói; chỉ hỏi một câu khi thiếu dữ kiện thiết yếu.
- Chỉ nêu vấn đề chính và một bước tiếp theo.
- Không bịa giá, thời gian, khách hàng, kết quả hay cam kết chưa có dữ liệu.
- Không nói mình là Gemini và không nhắc tới API.
- Nếu khách muốn báo giá, làm ngay hoặc gặp người thật, mời liên hệ Zalo 0582 283 454.

Ví dụ khi khách nói "xin chào":
"Chào anh/chị. Anh/chị gửi website cần xem, tôi nhận xét nhanh giúp mình nhé."
`;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders()
    }
  });
}

function interactionText(data) {
  return (Array.isArray(data?.steps) ? data.steps : [])
    .filter(step => step?.type === 'model_output')
    .flatMap(step => Array.isArray(step?.content) ? step.content : [])
    .filter(block => block?.type === 'text')
    .map(block => block?.text || '')
    .join('')
    .trim();
}

async function sendTelegram(text, env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        disable_web_page_preview: true
      })
    }
  );

  return response.ok;
}

async function handleChat(request, env) {
  if (!env.GEMINI_API_KEY) {
    return json({ error: 'GEMINI_API_KEY missing' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'invalid_json' }, 400);
  }

  const message = String(body.message || '').trim().slice(0, 1800);
  if (!message) return json({ error: 'missing_message' }, 400);

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        model: 'gemini-3.6-flash',
        system_instruction: SYSTEM_INSTRUCTION,
        input: [{ type: 'text', text: message }],
        generation_config: {
          temperature: 0.45,
          max_output_tokens: 150,
          thinking_level: 'minimal'
        },
        store: false
      })
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json({
      error: 'gemini_request_failed',
      detail: data?.error?.message || 'Gemini request failed'
    }, 502);
  }

  const reply = interactionText(data);
  if (!reply) return json({ error: 'empty_gemini_reply' }, 502);

  return json({ ok: true, reply });
}

async function handleLeadCapture(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ success: false, error: 'invalid_json' }, 400);
  }

  const {
    shopName = '',
    slogan = '',
    phone = '',
    primaryColor = '',
    customerName = '',
    customerPhone = '',
    template = ''
  } = body;

  const normalizedPhone = String(customerPhone).replace(/[\s.-]/g, '');
  if (
    !String(shopName).trim() ||
    !String(customerName).trim() ||
    !/^0\d{9}$/.test(normalizedPhone)
  ) {
    return json({ success: false, error: 'Thiếu thông tin bắt buộc' }, 422);
  }

  const message = [
    'KHÁCH TẠO DEMO MỚI:',
    `- Shop: ${shopName}`,
    `- SĐT khách: ${customerPhone} (${customerName})`,
    `- Hotline shop: ${phone || '—'}`,
    `- Mẫu: ${TPL[template] || `#${template}`}`,
    `- Slogan: ${slogan || '—'}`,
    `- Tone màu: ${primaryColor || '—'}`
  ].join('\n');

  const telegramSent = await sendTelegram(message, env);
  return json({ success: true, telegram: telegramSent, message: 'Lead captured' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json({
        ok: true,
        gemini_configured: Boolean(env.GEMINI_API_KEY),
        telegram_configured: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
        model: 'gemini-3.6-flash',
        version: WORKER_VERSION
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/chat') {
      return handleChat(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/api/lead-capture') {
      return handleLeadCapture(request, env);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders() });
  }
};
