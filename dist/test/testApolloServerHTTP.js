"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const expressApollo_1 = require('../integrations/expressApollo');
const chai_1 = require('chai');
const querystring_1 = require('querystring');
const zlib = require('zlib');
const multer = require('multer');
const bodyParser = require('body-parser');
const request = require('supertest-as-promised');
const express4 = require('express');
const express3 = express4;
const graphql_1 = require('graphql');
const QueryRootType = new graphql_1.GraphQLObjectType({
    name: 'QueryRoot',
    fields: {
        test: {
            type: graphql_1.GraphQLString,
            args: {
                who: {
                    type: graphql_1.GraphQLString
                }
            },
            resolve: (root, args) => 'Hello ' + (args['who'] || 'World')
        },
        thrower: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
            resolve: () => { throw new Error('Throws!'); }
        },
        context: {
            type: graphql_1.GraphQLString,
            resolve: (obj, args, context) => context,
        }
    }
});
const TestSchema = new graphql_1.GraphQLSchema({
    query: QueryRootType,
    mutation: new graphql_1.GraphQLObjectType({
        name: 'MutationRoot',
        fields: {
            writeTest: {
                type: QueryRootType,
                resolve: () => ({})
            }
        }
    })
});
function urlString(urlParams) {
    let str = '/graphql';
    if (urlParams) {
        str += ('?' + querystring_1.stringify(urlParams));
    }
    return str;
}
function catchError(p) {
    return p.then((res) => {
        if (res && res.error) {
            return { response: res };
        }
        throw new Error('Expected to catch error.');
    }, error => {
        if (!(error instanceof Error)) {
            throw new Error('Expected error to be instanceof Error.');
        }
        return error;
    });
}
function promiseTo(fn) {
    return new Promise((resolve, reject) => {
        fn((error, result) => error ? reject(error) : resolve(result));
    });
}
describe('test harness', () => {
    it('expects to catch errors', () => __awaiter(this, void 0, void 0, function* () {
        let caught;
        try {
            yield catchError(Promise.resolve());
        }
        catch (error) {
            caught = error;
        }
        chai_1.expect(caught && caught.message).to.equal('Expected to catch error.');
    }));
    it('expects to catch actual errors', () => __awaiter(this, void 0, void 0, function* () {
        let caught;
        try {
            yield catchError(Promise.reject('not a real error'));
        }
        catch (error) {
            caught = error;
        }
        chai_1.expect(caught && caught.message).to.equal('Expected error to be instanceof Error.');
    }));
    it('resolves callback promises', () => __awaiter(this, void 0, void 0, function* () {
        const resolveValue = {};
        const result = yield promiseTo(cb => cb(null, resolveValue));
        chai_1.expect(result).to.equal(resolveValue);
    }));
    it('rejects callback promises with errors', () => __awaiter(this, void 0, void 0, function* () {
        const rejectError = new Error();
        let caught;
        try {
            yield promiseTo(cb => cb(rejectError));
        }
        catch (error) {
            caught = error;
        }
        chai_1.expect(caught).to.equal(rejectError);
    }));
});
const express = express4;
const version = 'modern';
describe(`GraphQL-HTTP (apolloServer) tests for ${version} express`, () => {
    describe('POST functionality', () => {
        it('allows gzipped POST bodies', () => __awaiter(this, void 0, void 0, function* () {
            const app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress(() => ({
                schema: TestSchema
            })));
            const data = { query: '{ test(who: "World") }' };
            const json = JSON.stringify(data);
            const gzippedJson = yield promiseTo(cb => zlib.gzip(json, cb));
            const req = request(app)
                .post(urlString())
                .set('Content-Type', 'application/json')
                .set('Content-Encoding', 'gzip');
            req.write(gzippedJson);
            const response = yield req;
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                data: {
                    test: 'Hello World'
                }
            });
        }));
        it('allows deflated POST bodies', () => __awaiter(this, void 0, void 0, function* () {
            const app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress(() => ({
                schema: TestSchema
            })));
            const data = { query: '{ test(who: "World") }' };
            const json = JSON.stringify(data);
            const deflatedJson = yield promiseTo(cb => zlib.deflate(json, cb));
            const req = request(app)
                .post(urlString())
                .set('Content-Type', 'application/json')
                .set('Content-Encoding', 'deflate');
            req.write(deflatedJson);
            const response = yield req;
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                data: {
                    test: 'Hello World'
                }
            });
        }));
        it('allows for pre-parsed POST bodies', () => {
            const UploadedFileType = new graphql_1.GraphQLObjectType({
                name: 'UploadedFile',
                fields: {
                    originalname: { type: graphql_1.GraphQLString },
                    mimetype: { type: graphql_1.GraphQLString }
                }
            });
            const TestMutationSchema = new graphql_1.GraphQLSchema({
                query: new graphql_1.GraphQLObjectType({
                    name: 'QueryRoot',
                    fields: {
                        test: { type: graphql_1.GraphQLString }
                    }
                }),
                mutation: new graphql_1.GraphQLObjectType({
                    name: 'MutationRoot',
                    fields: {
                        uploadFile: {
                            type: UploadedFileType,
                            resolve(rootValue) {
                                return rootValue.request.file;
                            }
                        }
                    }
                })
            });
            const app = express();
            const storage = multer.memoryStorage();
            app.use(urlString(), multer({ storage: storage }).single('file'));
            app.use(urlString(), expressApollo_1.apolloExpress(req => {
                return {
                    schema: TestMutationSchema,
                    rootValue: { request: req }
                };
            }));
            const req = request(app)
                .post(urlString())
                .field('query', `mutation TestMutation {
          uploadFile { originalname, mimetype }
        }`)
                .attach('file', __filename);
            req.then((response) => {
                chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                    data: {
                        uploadFile: {
                            originalname: 'testApolloServerHTTP.js',
                            mimetype: 'application/javascript'
                        }
                    }
                });
            });
        });
    });
    describe('Error handling functionality', () => {
        it('handles field errors caught by GraphQL', () => __awaiter(this, void 0, void 0, function* () {
            const app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress({
                schema: TestSchema
            }));
            const response = yield request(app)
                .post(urlString())
                .send({
                query: '{thrower}',
            });
            chai_1.expect(response.status).to.equal(200);
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                data: null,
                errors: [{
                        message: 'Throws!',
                        locations: [{ line: 1, column: 2 }]
                    }]
            });
        }));
        it('allows for custom error formatting to sanitize', () => __awaiter(this, void 0, void 0, function* () {
            const app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress({
                schema: TestSchema,
                formatError(error) {
                    return { message: 'Custom error format: ' + error.message };
                }
            }));
            const response = yield request(app)
                .post(urlString())
                .send({
                query: '{thrower}',
            });
            chai_1.expect(response.status).to.equal(200);
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                data: null,
                errors: [{
                        message: 'Custom error format: Throws!',
                    }]
            });
        }));
        it('allows for custom error formatting to elaborate', () => __awaiter(this, void 0, void 0, function* () {
            const app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress({
                schema: TestSchema,
                formatError(error) {
                    return {
                        message: error.message,
                        locations: error.locations,
                        stack: 'Stack trace'
                    };
                }
            }));
            const response = yield request(app)
                .post(urlString())
                .send({
                query: '{thrower}',
            });
            chai_1.expect(response.status).to.equal(200);
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                data: null,
                errors: [{
                        message: 'Throws!',
                        locations: [{ line: 1, column: 2 }],
                        stack: 'Stack trace',
                    }]
            });
        }));
        it('handles unsupported HTTP methods', () => __awaiter(this, void 0, void 0, function* () {
            const app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress({ schema: TestSchema }));
            const response = yield request(app)
                .get(urlString({ query: '{test}' }));
            chai_1.expect(response.status).to.equal(405);
            chai_1.expect(response.headers.allow).to.equal('POST');
            return chai_1.expect(response.text).to.contain('Apollo Server supports only POST requests.');
        }));
    });
    describe('Custom validation rules', () => {
        const AlwaysInvalidRule = function (context) {
            return {
                enter() {
                    context.reportError(new graphql_1.GraphQLError('AlwaysInvalidRule was really invalid!'));
                    return graphql_1.BREAK;
                }
            };
        };
        it('Do not execute a query if it do not pass the custom validation.', () => __awaiter(this, void 0, void 0, function* () {
            const app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress({
                schema: TestSchema,
                validationRules: [AlwaysInvalidRule],
            }));
            const response = yield request(app)
                .post(urlString())
                .send({
                query: '{thrower}',
            });
            chai_1.expect(response.status).to.equal(400);
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                errors: [
                    {
                        message: 'AlwaysInvalidRule was really invalid!'
                    },
                ]
            });
        }));
    });
});
//# sourceMappingURL=testApolloServerHTTP.js.map