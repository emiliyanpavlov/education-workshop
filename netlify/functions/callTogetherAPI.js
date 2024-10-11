import fetch from 'node-fetch';

export const handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const API_ENDPOINT = 'https://api.together.xyz/v1/completions';
  const API_KEY = process.env.TOGETHER_API_KEY;

  try {
    const { prompt, ...otherParams } = JSON.parse(event.body);
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        ...otherParams
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log('API response:', data);

    if (!data.choices || !data.choices[0] || typeof data.choices[0].text !== 'string') {
      console.error('Unexpected API response structure:', data);
      throw new Error('Unexpected API response structure');
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message, details: error.toString() }) 
    };
  }
};