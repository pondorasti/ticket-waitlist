require('dotenv').config();

import * as sevenrooms from './sevenrooms';
import * as amc from './amc';

(async () => {
  await sevenrooms.check();
  // await amc.check();
})();
