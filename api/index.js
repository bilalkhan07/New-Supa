import emailOtpSend from '../server/api-handlers/email-otp-send.js';
import emailOtpVerify from '../server/api-handlers/email-otp-verify.js';
import verifyLoginCredentials from '../server/api-handlers/verify-login-credentials.js';
import getDesigners from '../server/api-handlers/get-designers.js';
import getJobs from '../server/api-handlers/get-jobs.js';
import saveJob from '../server/api-handlers/save-job.js';
import registerDesigner from '../server/api-handlers/register-designer.js';
import updateDesignerPassword from '../server/api-handlers/update-designer-password.js';
import notifyNewJob from '../server/api-handlers/notify-new-job.js';
import notifyJobAccepted from '../server/api-handlers/notify-job-accepted.js';
import sendEmail from '../server/api-handlers/send-email.js';
import triggerPushNotification from '../server/api-handlers/trigger-push-notification.js';
import pushSubscribe from '../server/api-handlers/push-subscribe.js';
import pushVapidPublicKey from '../server/api-handlers/push-vapid-public-key.js';
import getCityAddresses from '../server/api-handlers/get-city-addresses.js';

const routes = {
  'email-otp-send': emailOtpSend,
  'email-otp-verify': emailOtpVerify,
  'verify-login-credentials': verifyLoginCredentials,
  'get-designers': getDesigners,
  'get-jobs': getJobs,
  'save-job': saveJob,
  'register-designer': registerDesigner,
  'update-designer-password': updateDesignerPassword,
  'notify-new-job': notifyNewJob,
  'notify-job-accepted': notifyJobAccepted,
  'send-email': sendEmail,
  'trigger-push-notification': triggerPushNotification,
  'push-subscribe': pushSubscribe,
  'push-vapid-public-key': pushVapidPublicKey,
  'get-city-addresses': getCityAddresses
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract path from req.url or query params
  let rawPath = (req.url || '').split('?')[0].trim();
  rawPath = rawPath.replace(/^\/api\/?/, '').replace(/\.js$/, '').trim();

  // Also support ?route= / ?path= / ?slug=
  const routeName = rawPath || (req.query && (req.query.path || req.query.route || req.query.slug)) || '';

  const matchedHandler = routes[routeName];

  if (matchedHandler) {
    try {
      return await matchedHandler(req, res);
    } catch (err) {
      console.error(`Error in /api/${routeName}:`, err);
      return res.status(500).json({ success: false, message: err?.message || 'Internal Server Error' });
    }
  }

  // Health check
  if (!routeName || routeName === 'health' || routeName === 'ping') {
    return res.status(200).json({
      status: 'ok',
      message: 'Design Quixo Unified API Gateway Online',
      totalEndpoints: Object.keys(routes).length,
      endpoints: Object.keys(routes)
    });
  }

  return res.status(404).json({
    success: false,
    message: `API endpoint "/api/${routeName}" not found on Design Quixo API gateway.`
  });
}
