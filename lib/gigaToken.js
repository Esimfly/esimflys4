import axios from 'axios';

let accessToken = null;
let tokenExpiry = null;

export async function getGigaAccessToken() {
  const now = Date.now();

  if (accessToken && tokenExpiry && now < tokenExpiry) {
    // التوكن صالح، رجعه بدون طلب جديد
    return accessToken;
  }

  const basicAuth = process.env.GIGA_BASIC_AUTH;
  if (!basicAuth) {
    throw new Error('GIGA_BASIC_AUTH is not set in environment variables.');
  }

  try {
    const res = await axios.post(
      'https://api.giga.store/reseller/authenticate',
      null,
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    accessToken = res.data.accessToken;   // لاحظ الفرق هنا (camelCase)
    const expiresIn = res.data.expiresIn || 3600; // مدة الصلاحية بالثواني
    tokenExpiry = now + expiresIn * 1000; // وقت انتهاء الصلاحية بالميللي ثانية

    console.log('✅ Obtained new Giga access token');

    return accessToken;
  } catch (error) {
    console.error('❌ Failed to fetch Giga token:', error.response?.data || error.message);
    throw new Error('Unable to get Giga access token');
  }
}
