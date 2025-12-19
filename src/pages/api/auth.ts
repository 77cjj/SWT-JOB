import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { provider } = req.query;
  if (!provider) {
    return res.status(400).send('Missing provider');
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  
  // 本地开发时强制使用 localhost:3000，避免环境变量配置错误
  let baseUrl: string;
  if (process.env.NODE_ENV === 'development') {
    // 开发环境：优先使用环境变量，但如果没有设置则使用 localhost:3000
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  } else {
    // 生产环境：使用环境变量或 Vercel URL
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  }
  
  const redirectUri = `${baseUrl}/api/callback`;

  if (!clientId) {
    return res.status(500).send('OAUTH_CLIENT_ID not configured');
  }

  // 开发环境下，在控制台输出 redirect_uri 以便调试
  if (process.env.NODE_ENV === 'development') {
    console.log('[OAuth Debug] Redirect URI:', redirectUri);
    console.log('[OAuth Debug] Base URL:', baseUrl);
    console.log('[OAuth Debug] Make sure this matches your GitHub OAuth App callback URL exactly!');
  }

  // Decap CMS expects to open a popup that eventually signals back.
  // We redirect to GitHub to start the flow.
  // Scope 'repo' is needed for private repos or writing to public repos.
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
  
  res.redirect(authUrl);
}

