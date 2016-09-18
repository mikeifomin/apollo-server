"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const graphql = require('graphql');
const runQuery_1 = require('../core/runQuery');
const GraphiQL = require('../modules/renderGraphiQL');
function apolloKoa(options) {
    if (!options) {
        throw new Error('Apollo Server requires options.');
    }
    if (arguments.length > 1) {
        throw new Error(`Apollo Server expects exactly one argument, got ${arguments.length}`);
    }
    return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
        let optionsObject;
        if (isOptionsFunction(options)) {
            try {
                optionsObject = yield options(ctx.request, ctx);
            }
            catch (e) {
                ctx.status = 500;
                return ctx.body = `Invalid options provided to ApolloServer: ${e.message}`;
            }
        }
        else {
            optionsObject = options;
        }
        const formatErrorFn = optionsObject.formatError || graphql.formatError;
        if (!ctx.request.body) {
            ctx.status = 500;
            return ctx.body = 'POST body missing. Did you forget "app.use(koaBody())"?';
        }
        let b = ctx.request.body;
        let isBatch = true;
        if (!Array.isArray(b)) {
            isBatch = false;
            b = [b];
        }
        let responses = [];
        for (let requestParams of b) {
            try {
                const query = requestParams.query;
                const operationName = requestParams.operationName;
                let variables = requestParams.variables;
                if (typeof variables === 'string') {
                    try {
                        variables = JSON.parse(variables);
                    }
                    catch (error) {
                        ctx.status = 400;
                        return ctx.body = 'Variables are invalid JSON.';
                    }
                }
                let params = {
                    schema: optionsObject.schema,
                    query: query,
                    variables: variables,
                    context: optionsObject.context,
                    rootValue: optionsObject.rootValue,
                    operationName: operationName,
                    logFunction: optionsObject.logFunction,
                    validationRules: optionsObject.validationRules,
                    formatError: formatErrorFn,
                    formatResponse: optionsObject.formatResponse,
                    debug: optionsObject.debug,
                };
                if (optionsObject.formatParams) {
                    params = optionsObject.formatParams(params);
                }
                responses.push(yield runQuery_1.runQuery(params));
            }
            catch (e) {
                responses.push({ errors: [formatErrorFn(e)] });
            }
        }
        ctx.set('Content-Type', 'application/json');
        if (isBatch) {
            return ctx.body = JSON.stringify(responses);
        }
        else {
            const gqlResponse = responses[0];
            if (gqlResponse.errors && typeof gqlResponse.data === 'undefined') {
                ctx.status = 400;
            }
            return ctx.body = JSON.stringify(gqlResponse);
        }
    });
}
exports.apolloKoa = apolloKoa;
function isOptionsFunction(arg) {
    return typeof arg === 'function';
}
function graphiqlKoa(options) {
    return (ctx, next) => {
        const q = ctx.request.query || {};
        const query = q.query || '';
        const variables = q.variables || '{}';
        const operationName = q.operationName || '';
        const graphiQLString = GraphiQL.renderGraphiQL({
            endpointURL: options.endpointURL,
            query: query || options.query,
            variables: JSON.parse(variables) || options.variables,
            operationName: operationName || options.operationName,
        });
        ctx.set('Content-Type', 'text/html');
        ctx.body = graphiQLString;
    };
}
exports.graphiqlKoa = graphiqlKoa;
//# sourceMappingURL=koaApollo.js.map