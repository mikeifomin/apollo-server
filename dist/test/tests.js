"use strict";
require('babel-polyfill');
process.env.NODE_ENV = 'test';
require('source-map-support').install();
require('../core/runQuery.test');
require('../modules/operationStore.test');
require('../integrations/expressApollo.test');
require('../integrations/connectApollo.test');
require('../integrations/hapiApollo.test');
require('../integrations/koaApollo.test');
require('./testApolloServerHTTP');
//# sourceMappingURL=tests.js.map