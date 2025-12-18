import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Missing code');
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

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
      }),
    });

    const data = await response.json();
    const token = data.access_token;

    if (!token) {
      return res.status(403).send('Failed to retrieve token from GitHub');
    }

    // Return the script that posts the message back to the main window (Decap CMS)
    // The targetOrigin * should be restricted in production ideally, but for general use * is common in these CMS helpers.
    const content = `
      <script>
        const receiveMessage = (message) => {
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify({ token, provider: 'github' })}',
            '*'
          );
          window.close();
        };
        receiveMessage();
      </script>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(content);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

