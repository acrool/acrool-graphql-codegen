import {OperationDefinitionNode} from 'graphql';
import {
    buildMapperImport,
    ParsedMapper,
    parseMapper,
} from '@graphql-codegen/visitor-plugin-common';
import {ReactQueryRawPluginConfig} from './config';
import {FetcherRenderer} from './fetcher';
import {ReactQueryVisitor} from './visitor';

export class CustomMapperFetcher implements FetcherRenderer {
    private _mapperQuery: ParsedMapper;
    private _mapperInfiniteQuery: ParsedMapper;
    private _mapperQueryClient: ParsedMapper;
    private _mapperMutation: ParsedMapper;
    private _isQueryAndQueryClient: boolean;

    constructor(private visitor: ReactQueryVisitor, customFetcher: ReactQueryRawPluginConfig['fetcher']) {
        if (typeof customFetcher === 'undefined') {
            customFetcher = {
                queryFunc: 'createQueryHook',
                queryAndQueryClientFunc: 'createQueryAndQueryClientHook',
                infiniteQueryFunc: 'createInfiniteQueryHook',
                mutationFunc: 'createMutationHook',
                isQueryAndQueryClient: true,
            };
        }
        this._mapperQuery = parseMapper(customFetcher.queryFunc);
        this._mapperQueryClient = parseMapper(customFetcher.queryAndQueryClientFunc);
        this._mapperInfiniteQuery = parseMapper(customFetcher.infiniteQueryFunc);
        this._mapperMutation = parseMapper(customFetcher.mutationFunc);
        this._isQueryAndQueryClient = customFetcher.isQueryAndQueryClient;
    }

    private getSubscriptionFnName(operationResultType: string, operationVariablesTypes: string): string {
        return `useSubscription<TData, ${operationVariablesTypes}>`;
    }

    generateFetcherImplementaion(): string {
        if (this._mapperQuery.isExternal) {
            return buildMapperImport(
                this._mapperQuery.source,
                [
                    {
                        identifier: this._mapperQuery.type,
                        asDefault: this._mapperQuery.default,
                    },
                    {
                        identifier: this._mapperQueryClient.type,
                        asDefault: this._mapperQueryClient.isExternal ? this._mapperQueryClient.default : false,
                    },
                    {
                        identifier: this._mapperInfiniteQuery.type,
                        asDefault: this._mapperInfiniteQuery.isExternal ? this._mapperInfiniteQuery.default : false,
                    },
                    {
                        identifier: this._mapperMutation.type,
                        asDefault: this._mapperMutation.isExternal ? this._mapperMutation.default : false,
                    },
                ],
                this.visitor.config.useTypeImports,
            );
        }

        return null;
    }

    generateSubscriptionHook(
        node: OperationDefinitionNode,
        documentVariableName: string,
        operationName: string,
        operationResultType: string,
        operationVariablesTypes: string,
        hasRequiredVariables: boolean,
    ): string {
        const variables = `args${hasRequiredVariables ? '' : '?'}: SubscriptionHookOptions<TData, ${operationVariablesTypes}>`;
        // const hookConfig = this.visitor.queryMethodMap;
        // this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.subscription.hook);
        // this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.subscription.options);

        const typedFetcher = this.getSubscriptionFnName(operationResultType, operationVariablesTypes);
        const impl = `${typedFetcher}(gql(${documentVariableName}), args);`;

        return `export const use${operationName} = <
      TData = ${operationResultType},
      TError = ${this.visitor.config.errorType}
    >(
      ${variables},
    ) =>
      ${impl}
    `;
    }

}
