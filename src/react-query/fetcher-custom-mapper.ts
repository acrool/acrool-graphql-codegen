import {OperationDefinitionNode} from 'graphql';
import {
    buildMapperImport,
    ParsedMapper,
    parseMapper,
} from '@graphql-codegen/visitor-plugin-common';
import {CustomFetch, ReactQueryRawPluginConfig} from './config';
import {FetcherRenderer} from './fetcher';
import {
    generateInfiniteQueryKey,
    generateMutationKey,
    generateQueryKey,
} from './variables-generator';
import {ReactQueryVisitor} from './visitor';



export class CustomMapperFetcher implements FetcherRenderer {
    private _mapperQuery: ParsedMapper;
    private _mapperInfiniteQuery: ParsedMapper;
    private _mapperQueryClient: ParsedMapper;
    private _mapperMutation: ParsedMapper;
    private _isQueryAndQueryClient: boolean;

    constructor(private visitor: ReactQueryVisitor, customFetcher: ReactQueryRawPluginConfig['fetcher']) {
        if (typeof customFetcher === 'string') {
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

    private getFetcherQueryFnName(): string {
        return this._mapperQuery.type;
    }
    private getFetcherInfiniteQueryFnName(): string {
        return this._mapperInfiniteQuery.type;
    }
    private getFetcherQueryClientFnName(): string {
        return this._mapperQueryClient.type;
    }
    private getFetcherMutationFnName(): string {
        return this._mapperMutation.type;
    }
    // private getFetcherFnName(operationResultType: string, operationVariablesTypes: string): string {
    //     return `${this._mapper.type}<${operationResultType}, IUseFetcherArgs<${operationVariablesTypes}>>`;
    // }
    private getSubscriptionFnName(operationResultType: string, operationVariablesTypes: string): string {
        return `useSubscription<TData, ${operationVariablesTypes}>`;
    }

    generateFetcherImplementaion(): string {
        // if (this._mapper.isExternal) {
        //     return buildMapperImport(
        //         this._mapper.source,
        //         [
        //             {
        //                 identifier: 'IUseFetcherArgs',
        //                 asDefault: false,
        //             },
        //             {
        //                 identifier: this._mapper.type,
        //                 asDefault: this._mapper.default,
        //             },
        //         ],
        //         this.visitor.config.useTypeImports,
        //     );
        // }

        return null;
    }

    generateInfiniteQueryHook(
        node: OperationDefinitionNode,
        documentVariableName: string,
        operationName: string,
        operationResultType: string,
        operationVariablesTypes: string,
        hasRequiredVariables: boolean,
    ): string {
        // const pageParamKey = `pageParamKey: keyof ${operationVariablesTypes}`;
        // const variables = `variables${hasRequiredVariables ? '' : '?'}: IUseFetcherArgs<${operationVariablesTypes}>`;

        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.infiniteQuery.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.infiniteQuery.options);

        const typedFetcher = this.getFetcherInfiniteQueryFnName();

        const impl = `use${operationName} = ${typedFetcher}`;

        return `export const ${impl}<
   ${operationResultType}, 
   ${operationVariablesTypes}
>(${documentVariableName}, EQueryKey.${operationName});`;
    }

    generateQueryHook(
        node: OperationDefinitionNode,
        documentVariableName: string,
        operationName: string,
        operationResultType: string,
        operationVariablesTypes: string,
        hasRequiredVariables: boolean,
    ): string {
        // const variables = `args${hasRequiredVariables ? '' : '?'}: IUseFetcherArgs<${operationVariablesTypes}>`;

        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.query.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.query.options);

        // const options = `options?: Partial<${hookConfig.query.options}<${operationResultType}, TError, TData>>`;

        const typedFetcher = this.getFetcherQueryFnName();
        const typedFetcherAndClient = this.getFetcherQueryClientFnName();
        const impl = this._isQueryAndQueryClient && !!typedFetcherAndClient
            ? `{useQuery: use${operationName}, useQueryClient: use${operationName}Client} = ${typedFetcherAndClient}`
            : `use${operationName} = ${typedFetcher}`;

        return `export const ${impl}<
   ${operationResultType}, 
   ${operationVariablesTypes}
>(${documentVariableName}, EQueryKey.${operationName});`;
    }



    generateMutationHook(
        node: OperationDefinitionNode,
        documentVariableName: string,
        operationName: string,
        operationResultType: string,
        operationVariablesTypes: string,
        hasRequiredVariables: boolean,
    ): string {
        const variables = `<!--variables?: IUseFetcherArgs<${operationVariablesTypes}>-->`;
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.mutation.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.mutation.options);

        // const options = `options?: Partial<${hookConfig.mutation.options}<${operationResultType}, TError, IUseFetcherArgs<${operationVariablesTypes}>, TContext>>`;
        const typedFetcher = this.getFetcherMutationFnName();

        return `export const use${operationName} = ${typedFetcher}<
    ${operationResultType}, 
    ${operationVariablesTypes}
>(${documentVariableName}, EMutationKey.${operationName});

`;


//         return `export const use${operationName} = <
//       TError = ${this.visitor.config.errorType},
//       TContext = unknown
//     >(${options}) =>
//     ${
//     hookConfig.mutation.hook
// }<${operationResultType}, TError, IUseFetcherArgs<${operationVariablesTypes}>, TContext>({
//       mutationKey: ${generateMutationKey(node)},
//       mutationFn: ${impl},
//       ...options
//     });`;
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
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.query.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.query.options);

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
