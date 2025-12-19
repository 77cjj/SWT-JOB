import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error } = req.query;
  
  if (error) {
    const errorContent = `
      <script>
        window.opener.postMessage(
          'authorization:github:error:${JSON.stringify({ error })}',
          '*'
        );
        window.close();
      </script>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(errorContent);
  }
  
  if (!code) {
    return res.status(400).send('Missing code');
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/callback`;

  if (!clientId || !clientSecret) {
    return res.status(500).send('OAUTH configuration missing');
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      const errorContent = `
        <script>
          window.opener.postMessage(
            'authorization:github:error:${JSON.stringify({ error: data.error, error_description: data.error_description })}',
            '*'
          );
          window.close();
        </script>
      `;
      res.setHeader('Content-Type', 'text/html');
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

    res.setHeader('Content-Type', 'text/html');
    res.send(content);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorContent = `
      <script>
        window.opener.postMessage(
          'authorization:github:error:${JSON.stringify({ error: 'internal_error', error_description: String(error) })}',
          '*'
        );
        window.close();
      </script>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(errorContent);
  }
}

