import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { provider } = req.query;
  if (!provider) {
    return res.status(400).send('Missing provider');
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const redirectUri = process.env.OAUTH_REDIRECT_URI || ''; // Optional, should match GitHub app settings if strictly enforced

  if (!clientId) {
    return res.status(500).send('OAUTH_CLIENT_ID not configured');
  }

  // Decap CMS expects to open a popup that eventually signals back.
  // We redirect to GitHub to start the flow.
  // Scope 'repo' is needed for private repos or writing to public repos.
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`;
  
  res.redirect(authUrl);
}

