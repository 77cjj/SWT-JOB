import type { NextApiRequest, NextApiResponse } from 'next';

type InquiryBody = {
  message?: string;
  contact?: string;
  pageUrl?: string;
  topic?: string;
};

async function notifyPushPlus(token: string, title: string, content: string) {
  const res = await fetch('https://www.pushplus.plus/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, title, content, template: 'txt' }),
  });
  if (!res.ok) {
    throw new Error(`PushPlus HTTP ${res.status}`);
  }
  const data = (await res.json()) as { code?: number; msg?: string };
  if (data.code !== 200) {
    throw new Error(data.msg || 'PushPlus 发送失败');
  }
}

async function notifyWebhook(url: string, payload: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Webhook HTTP ${res.status}`);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as InquiryBody;
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const contact = typeof body.contact === 'string' ? body.contact.trim() : '';
  const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic.trim() : 'general';

  if (message.length < 4) {
    return res.status(400).json({ ok: false, message: '留言内容太短' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ ok: false, message: '留言内容过长' });
  }

  const payload = {
    source: 'swt-helper',
    topic,
    message,
    contact: contact || '(未留)',
    pageUrl: pageUrl || '(未知)',
    at: new Date().toISOString(),
  };

  const pushplusToken = process.env.SITE_INQUIRY_PUSHPLUS_TOKEN;
  const webhookUrl = process.env.SITE_INQUIRY_WEBHOOK_URL;

  try {
    if (pushplusToken) {
      await notifyPushPlus(
        pushplusToken,
        `SWT Helper · ${topic === 'deals' ? '羊毛咨询' : '站点留言'}`,
        [`页面: ${payload.pageUrl}`, `联系方式: ${payload.contact}`, '', message].join('\n'),
      );
    } else if (webhookUrl) {
      await notifyWebhook(webhookUrl, payload);
    } else if (process.env.NODE_ENV === 'development') {
      console.info('[site-inquiry]', payload);
    } else {
      return res.status(503).json({
        ok: false,
        message: '留言通道尚未配置，请联系站长',
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[site-inquiry] notify failed', error);
    return res.status(502).json({ ok: false, message: '通知发送失败，请稍后再试' });
  }
}
