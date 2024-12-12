import autoBind from 'auto-bind';
import {pascalCase} from 'change-case-all';
import {GraphQLSchema, OperationDefinitionNode} from 'graphql';
import {Types} from '@graphql-codegen/plugin-helpers';
import {ClientSideBasePluginConfig, ClientSideBaseVisitor, DocumentMode, getConfigValue, LoadedFragment} from '@graphql-codegen/visitor-plugin-common';
import {ReactQueryRawPluginConfig} from './config';
import {FetcherRenderer} from './fetcher';
import {CustomMapperFetcher} from './fetcher-custom-mapper';
import {
    generateMutationKeyMaker,
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

        // const hookAndTypeImports = [
        //     ...Array.from(this.reactQueryHookIdentifiersInUse),
        //     'useQueryClient',
        //     'QueryClient',
        //     'Updater',
        //     ...Array.from(this.reactQueryOptionsIdentifiersInUse).map(
        //         identifier => `${this.config.useTypeImports ? 'type ' : ''}${identifier}`,
        //     ),
        // ];

        const moduleName = this.config.legacyMode ? 'react-query' : '@tanstack/react-query';



        return [
            ...baseImports,
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
        if (name.includes('Subscription')) {
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

