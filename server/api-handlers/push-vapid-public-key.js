const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BN3PRogrLXTWkDjdv9B0QdDEGuUH5-cNIewJ6KgJ2glQrLgtGng1WocCuqmzrL1-BIdSfNb6SX2Xz0HzsP8Yuhk';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    publicKey: VAPID_PUBLIC_KEY
  });
}
