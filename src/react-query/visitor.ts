import autoBind from 'auto-bind';
import {pascalCase} from 'change-case-all';
import {GraphQLSchema, OperationDefinitionNode} from 'graphql';
import {Types} from '@graphql-codegen/plugin-helpers';
import {ClientSideBasePluginConfig, ClientSideBaseVisitor, DocumentMode, getConfigValue, LoadedFragment} from '@graphql-codegen/visitor-plugin-common';
import {ReactQueryRawPluginConfig} from './config';
import {FetcherRenderer} from './fetcher';
import {CustomMapperFetcher} from './fetcher-custom-mapper';
import {
    generateInfiniteQueryKeyMaker,
    generateMutationKeyMaker,
    generateQueryKeyMaker,
} from './variables-generator';



export interface ReactQueryPluginConfig extends ClientSideBasePluginConfig {
    errorType: string;
    exposeDocument: boolean;
    exposeQueryKeys: boolean;
    exposeSetQueryData: boolean;
    exposeMutationKeys: boolean;
    exposeQueryClientHook: boolean;
    exposeFetcher: boolean;
    addInfiniteQuery: boolean;
    legacyMode: boolean;
}

export interface ReactQueryMethodMap {
    infiniteQuery: {
        hook: string;
        options: string;
    };
    query: {
        hook: string;
        options: string;
    };
    mutation: {
        hook: string;
        options: string;
    };
    subscription: {
        hook: string;
        options: string;
    };
}

export class ReactQueryVisitor extends ClientSideBaseVisitor<
    ReactQueryRawPluginConfig,
    ReactQueryPluginConfig
> {
    private _externalImportPrefix: string;
    public fetcher: FetcherRenderer;
    public reactQueryHookIdentifiersInUse = new Set<string>();
    public reactQueryOptionsIdentifiersInUse = new Set<string>();

    public queryMethodMap: ReactQueryMethodMap = {
        infiniteQuery: {
            hook: 'useInfiniteQuery',
            options: 'UseInfiniteQueryOptions',
        },
        query: {
            hook: 'useQuery',
            options: 'UseQueryOptions',
        },
        mutation: {
            hook: 'useMutation',
            options: 'UseMutationOptions',
        },
        subscription: {
            hook: 'useSubscription',
            options: 'UseSubscriptionOptions',
        },
    };

    constructor(
        schema: GraphQLSchema,
        fragments: LoadedFragment[],
        protected rawConfig: ReactQueryRawPluginConfig,
        documents: Types.DocumentFile[],
    ) {
        super(schema, fragments, rawConfig, {
            documentMode: DocumentMode.string,
            errorType: getConfigValue(rawConfig.errorType, 'unknown'),
            exposeDocument: getConfigValue(rawConfig.exposeDocument, false),
            exposeQueryKeys: getConfigValue(rawConfig.exposeQueryKeys, false),
            exposeQueryClientHook: getConfigValue(rawConfig.exposeQueryClientHook, false),
            exposeMutationKeys: getConfigValue(rawConfig.exposeMutationKeys, false),
            exposeFetcher: getConfigValue(rawConfig.exposeFetcher, false),
            addInfiniteQuery: getConfigValue(rawConfig.addInfiniteQuery, false),
            legacyMode: getConfigValue(rawConfig.legacyMode, false),
        });
        this._externalImportPrefix = this.config.importOperationTypesFrom
            ? `${this.config.importOperationTypesFrom}.`
            : '';
        this._documents = documents;
        this.fetcher = this.createFetcher(rawConfig.fetcher);

        autoBind(this);
    }

    public get imports(): Set<string> {
        return this._imports;
    }

    private createFetcher(raw: ReactQueryRawPluginConfig['fetcher']): FetcherRenderer {
        return new CustomMapperFetcher(this, raw);
    }

    public get hasOperations() {
        return this._collectedOperations.length > 0;
    }

    public getImports(): string[] {
        const baseImports = super.getImports();

        if (!this.hasOperations) {
            return baseImports;
        }

        const hookAndTypeImports = [
            ...Array.from(this.reactQueryHookIdentifiersInUse),
            'useQueryClient',
            'QueryClient',
            'Updater',
            ...Array.from(this.reactQueryOptionsIdentifiersInUse).map(
                identifier => `${this.config.useTypeImports ? 'type ' : ''}${identifier}`,
            ),
        ];
        
        const moduleName = this.config.legacyMode ? 'react-query' : '@tanstack/react-query';

        

        return [
            ...baseImports,
            `import { ${hookAndTypeImports.join(', ')} } from '${moduleName}';`,
            'import {gql, useSubscription, SubscriptionHookOptions} from \'@apollo/client\';',
        ];
    }

    public getFetcherImplementation(): string {
        return this.fetcher.generateFetcherImplementaion();
    }

    private _getHookSuffix(name: string, operationType: string) {
        if (this.config.omitOperationSuffix) {
            return '';
        }
        if (!this.config.dedupeOperationSuffix) {
            return pascalCase(operationType);
        }
        if (name.includes('Query') || name.includes('Mutation') || name.includes('Subscription')) {
            return '';
        }
        return pascalCase(operationType);
    }

    
    protected buildOperation(
        node: OperationDefinitionNode,
        documentVariableName: string,
        operationType: string,
        operationResultType: string,
        operationVariablesTypes: string,
        hasRequiredVariables: boolean,
    ): string {
        const nodeName = node.name?.value ?? '';
        // const suffix = this._getHookSuffix(nodeName, operationType);
        const operationName: string = this.convertName(nodeName, {
            // suffix,
            useTypesPrefix: false,
            useTypesSuffix: false,
        });

        operationResultType = this._externalImportPrefix + operationResultType;
        operationVariablesTypes = this._externalImportPrefix + operationVariablesTypes;


        const query: string[] = [];
        const queryNames: string[] = [];
        switch (operationType){
        case 'Query':
            query.push(this.fetcher.generateQueryHook(
                node,
                documentVariableName,
                operationName,
                operationResultType,
                operationVariablesTypes,
                hasRequiredVariables,
            ));
            if (this.config.exposeDocument) {
                query.push(`use${operationName}.document = ${documentVariableName}`);
            }
            if (this.config.exposeQueryKeys) {
                query.push(generateQueryKeyMaker(
                    node,
                    operationName,
                    operationVariablesTypes,
                    hasRequiredVariables,
                ));
            }

            if (this.config.addInfiniteQuery) {
                query.push(this.fetcher.generateInfiniteQueryHook(
                    node,
                    documentVariableName,
                    operationName,
                    operationResultType,
                    operationVariablesTypes,
                    hasRequiredVariables,
                ));
                
                if (this.config.exposeQueryKeys) {
                    query.push(generateInfiniteQueryKeyMaker(
                        node,
                        operationName,
                        operationVariablesTypes,
                        hasRequiredVariables,
                    ));
                }
            }

            // The reason we're looking at the private field of the CustomMapperFetcher to see if it's a react hook
            // is to prevent calling generateFetcherFetch for each query since all the queries won't be able to generate
            // a fetcher field anyways.

            return query.join('\n');



        case 'Mutation':
            query.push(this.fetcher.generateMutationHook(
                node,
                documentVariableName,
                operationName,
                operationResultType,
                operationVariablesTypes,
                hasRequiredVariables,
            ));
            if (this.config.exposeMutationKeys) {
                query.push(generateMutationKeyMaker(node, operationName));
            }
            return query.join('\n');


        case 'Subscription':
            // console.warn(
            //     `Plugin "typescript-react-query" does not support GraphQL Subscriptions at the moment! Ignoring "${node.name.value}"...`,
            // );

            query.push(this.fetcher.generateSubscriptionHook(
                node,
                documentVariableName,
                operationName,
                operationResultType,
                operationVariablesTypes,
                hasRequiredVariables,
            ));
            if (this.config.exposeMutationKeys) {
                query.push(generateMutationKeyMaker(node, operationName));
            }
            return query.join('\n');
        }

        return null;
    }
}

