import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error } = req.query;
  
  if (error) {
    const errorContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>授权错误</title>
        </head>
        <body>
          <script>
            window.opener.postMessage(
              'authorization:github:error:${JSON.stringify({ error })}',
              '*'
            );
            window.close();
          </script>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(errorContent);
  }
  
  if (!code) {
    return res.status(400).send('Missing code');
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  
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
  
  // 开发环境下，在控制台输出 redirect_uri 以便调试
  if (process.env.NODE_ENV === 'development') {
    console.log('[OAuth Callback Debug] Redirect URI:', redirectUri);
  }

  if (!clientId || !clientSecret) {
    const errorContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>配置错误</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <h1 class="error">配置错误</h1>
          <p>OAuth 环境变量未配置。请检查 .env.local 文件。</p>
          <script>
            window.opener.postMessage(
              'authorization:github:error:${JSON.stringify({ error: 'configuration_error', error_description: 'OAUTH configuration missing' })}',
              '*'
            );
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(errorContent);
  }

  // 重试函数
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // 添加超时控制（30秒）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error: unknown) {
        const isLastAttempt = i === maxRetries - 1;
        const errorObj = error as { code?: string; name?: string; message?: string };
        const isNetworkError = errorObj.code === 'ECONNRESET' || 
                              errorObj.code === 'ETIMEDOUT' || 
                              errorObj.name === 'AbortError' ||
                              errorObj.message?.includes('fetch failed');
        
        if (isLastAttempt || !isNetworkError) {
          throw error;
        }
        
        // 等待后重试（指数退避）
        const delay = Math.min(1000 * Math.pow(2, i), 5000);
        console.log(`[OAuth] 网络错误，${delay}ms 后重试 (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  };

  try {
    console.log('[OAuth] 正在向 GitHub 请求访问令牌...');
    const response = await fetchWithRetry('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'SWT-Job-Picker-CMS',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OAuth] GitHub API 错误:', response.status, errorText);
      throw new Error(`GitHub API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      const errorContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>授权错误</title>
          </head>
          <body>
            <script>
              window.opener.postMessage(
                'authorization:github:error:${JSON.stringify({ error: data.error, error_description: data.error_description })}',
                '*'
              );
              window.close();
            </script>
          </body>
        </html>
      `;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(errorContent);
    }

    const token = data.access_token;

    if (!token) {
      return res.status(403).send('Failed to retrieve token from GitHub');
    }

    // Return the script that posts the message back to the main window (Decap CMS)
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>授权成功</title>
        </head>
        <body>
          <script>
            (function() {
              try {
                window.opener.postMessage(
                  'authorization:github:success:${JSON.stringify({ token, provider: 'github' })}',
                  '*'
                );
              } catch (e) {
                console.error('Failed to post message:', e);
              }
              setTimeout(function() {
                window.close();
              }, 100);
            })();
          </script>
          <p>授权成功！如果窗口没有自动关闭，请手动关闭。</p>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(content);

  } catch (error: unknown) {
    console.error('[OAuth] 回调错误:', error);
    
    const errorObj = error as { code?: string; name?: string; message?: string };
    const errorMessage = errorObj.message || String(error);
    const isNetworkError = errorObj.code === 'ECONNRESET' || 
                          errorObj.code === 'ETIMEDOUT' || 
                          errorObj.name === 'AbortError' ||
                          errorMessage.includes('fetch failed');
    
    const errorDescription = isNetworkError 
      ? '网络连接失败，请检查网络连接或稍后重试'
      : errorMessage;
    
    const errorContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>授权失败</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              text-align: center; 
              padding: 50px 20px;
              background: #f5f5f5;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .error { color: #d32f2f; }
            .retry-btn {
              margin-top: 20px;
              padding: 10px 20px;
              background: #1976d2;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            }
            .retry-btn:hover {
              background: #1565c0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">授权失败</h1>
            <p>${errorDescription}</p>
            ${isNetworkError ? `
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                这可能是网络连接问题。请检查：
                <br>• 网络连接是否正常
                <br>• 防火墙是否阻止了连接
                <br>• 是否使用了代理（可能需要配置）
              </p>
              <button class="retry-btn" onclick="window.location.reload()">重试</button>
            ` : ''}
            <script>
              try {
                window.opener.postMessage(
                  'authorization:github:error:${JSON.stringify({ error: 'internal_error', error_description: errorDescription })}',
                  '*'
                );
              } catch (e) {
                console.error('Failed to post message:', e);
              }
              ${!isNetworkError ? 'setTimeout(() => window.close(), 3000);' : ''}
            </script>
          </div>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(errorContent);
  }
}

