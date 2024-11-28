import { api_link } from '@/lib/api';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
      const response = await fetch(`${api_link}/search/all?query=${query}`);
      const data = await response.json();

      if (data.data) {
        return res.status(200).json(data.data);
      } else {
        return res.status(404).json({ error: 'No results found' });
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
