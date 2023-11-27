import {parse, buildSchema} from 'graphql';
import {plugin} from '../index';



const basicDoc = parse(/* GraphQL */ `
    query testQuery {
        feed {
            id
            commentCount
            repository {
                full_name
                html_url
                owner {
                    avatar_url
                }
            }
        }
    }
`);

const queryWithRequiredVariablesDoc = parse(/* GraphQL */ `
    query WithRequiredVariables($type: FeedType!) {
        feed(type: $type) {
            id
        }
    }
`);

const queryWithNonNullDefaultVariablesDoc = parse(/* GraphQL */ `
    query WithNonNullDefaultVariables($type: FeedType! = HOT) {
        feed(type: $type) {
            id
        }
    }
`);

const mutationDoc = parse(/* GraphQL */ `
    mutation testMutation($name: String) {
        submitRepository(repoFullName: $name) {
            id
        }
    }
`);

const subscriptionDoc = parse(/* GraphQL */ `
    subscription testSubscription($name: String) {
        commentAdded(repoFullName: $name) {
            id
        }
    }
`);

describe('My Plugin', () => {


    const schema = buildSchema(/* GraphQL */ `
        type Query {
            workspacesWithPagination: String!
            workspaces: String!
            workspace: String!
        }

        type Mutation {
            workspaceCreate: WorkspaceCreateInput!
        }
        type PaginateInput {
            name: String
        }
        type WorkspaceCreateInput {
            ownerId: String
        }

    `);
    const docs = [
        {
            document: basicDoc,
        },
        // {
        //     document: basicMutation,
        // },
    ];

    const usedBefore = process.memoryUsage().heapUsed;

    it('Should greet', async () => {
        const result = await plugin(schema, docs, {
            // name: 'bear-react-query'
            omitOperationSuffix: true,
            exposeDocument: false,
            exposeQueryKeys: true,
            exposeQuerySetData: true,
        });

        const usedAfter = process.memoryUsage().heapUsed;
        console.log(`Memory used by the function: ${(usedAfter - usedBefore) / 1024 / 1024} MB`);

        expect(result).toStrictEqual({
            "content": "\nexport const TestQueryDocument = `\n    query testQuery {\n  feed {\n    id\n    commentCount\n    repository {\n      full_name\n      html_url\n      owner {\n        avatar_url\n      }\n    }\n  }\n}\n    `;\nexport const useTestQuery = <\n      TData = TestQuery,\n      TError = unknown\n    >(\n      args?: IUseFetcherArgs<TestQueryVariables>,\n      options?: Partial<UseQueryOptions<TestQuery, TError, TData>>\n    ) =>\n    useQuery<TestQuery, TError, TData>({\n      queryKey: args?.variables ? ['testQuery', args.variables]: ['testQuery'],\n      queryFn: fetch<TestQuery, IUseFetcherArgs<TestQueryVariables>>(TestQueryDocument, args),\n      ...options\n    });\n\nuseTestQuery.getKey = (variables?: TestQueryVariables) => variables ? ['testQuery', variables]: ['testQuery'];\n\n\n\nuseTestQuery.setData = <TData = TestQuery>(qc: QueryClient, args: {\n        variables?: TestQueryVariables, \n        updater: Updater<TData|undefined, TData|undefined>\n    }) => {\n        qc.setQueryData(useTestQuery.getKey(args.variables), args.updater);\n    }\n",
            "prepend": [
                "import { useQuery, QueryClient, Updater, UseQueryOptions } from '@tanstack/react-query';",
                "import {gql, useSubscription, SubscriptionHookOptions} from '@apollo/client';",
                null
            ]
        });
    });
});
