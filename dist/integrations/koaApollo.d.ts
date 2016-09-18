import * as koa from 'koa';
import ApolloOptions from './apolloOptions';
import * as GraphiQL from '../modules/renderGraphiQL';
export interface KoaApolloOptionsFunction {
    (req: koa.Request, ctx: any): ApolloOptions | Promise<ApolloOptions>;
}
export interface KoaHandler {
    (req: any, next: any): void;
}
export declare function apolloKoa(options: ApolloOptions | KoaApolloOptionsFunction): KoaHandler;
export declare function graphiqlKoa(options: GraphiQL.GraphiQLData): (ctx: any, next: any) => void;
