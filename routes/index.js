const router = require('express').Router();
const { requiresAuth } = require('express-openid-connect');
const axios = require('axios')

const traceHeaders = [
  'x-request-id',
  'x-b3-traceid',
  'x-b3-spanid',
  'x-b3-parentspanid',
  'x-b3-sampled',
  'x-b3-flags',
  'b3',
  'x-ot-span-context',
];

const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL;
if (!CUSTOMER_SERVICE_URL) {
  throw new Error('CUSTOMER_SERVICE_URL is not set');
}

function getFowardHeaders(req) {
  const headers = {};

  for (let i = 0; i < 7; i++) {
    const traceHeader = traceHeaders[i];
    const value = req.get(traceHeader);

    if (value) {
      headers[traceHeader] = value;
    }
  }
  
  const access_token = req.oidc?.accessToken?.access_token;
  if (access_token){
    headers['Authorization'] = `Bearer ${access_token}`
  }
  return headers;
}

async function getCustomers(req) {
  // tslint:disable-next-line:no-console
  console.log(`Making GET request to: ${CUSTOMER_SERVICE_URL}`);

  const headers = getFowardHeaders(req);

  // tslint:disable-next-line:no-console
  console.log(`Attaching headers: `, headers);

  return axios.get(CUSTOMER_SERVICE_URL, { headers }).then((res) => {
    return res.data;
  });
}

router.get('/', async (req, res, next) => {
  // Call the customers service
  getCustomers(req).then(customers => {
    res.render('index', {
      isAuthenticated: req.oidc.isAuthenticated(),
      customers: JSON.stringify(customers),
    });
  }, (err) => {
      console.log('ERROR', err)
      res.render('index', {
        isAuthenticated: req.oidc.isAuthenticated(),
        customers: err,
      });
  }).catch(() => {
  })
})

router.get('/profile', requiresAuth(), function (req, res, next) {
  res.render('profile', {
    userProfile: JSON.stringify(req.oidc.user, null, 2),
    title: 'Profile page'
  });
});

module.exports = router;
