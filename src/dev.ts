require('dotenv').config();

import * as checker from './amc';

(async () => {
  await checker.check();
})();
