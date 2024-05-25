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
            exposeQueryClientHook: true,
        });

        const usedAfter = process.memoryUsage().heapUsed;
        console.log(`Memory used by the function: ${(usedAfter - usedBefore) / 1024 / 1024} MB`);

        const testQueryDocument = `\`
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
    \`;
export const useTestQuery = <
      TData = TestQuery,
      TError = unknown
    >(
      args?: IUseFetcherArgs<TestQueryVariables>,
      options?: Partial<UseQueryOptions<TestQuery, TError, TData>>
    ) =>
    useQuery<TestQuery, TError, TData>({
      queryKey: args?.variables ? ['testQuery', args.variables]: ['testQuery'],
      queryFn: fetch<TestQuery, IUseFetcherArgs<TestQueryVariables>>(TestQueryDocument, args),
      ...options
    });

useTestQuery.getKey = (variables?: TestQueryVariables) => variables ? ['testQuery', variables]: ['testQuery'];



useTestQuery.setData = <TData = TestQuery>(qc: QueryClient, args: {
        variables?: TestQueryVariables, 
        updater: Updater<TData|undefined, TData|undefined>
    }) => {
        qc.setQueryData(useTestQuery.getKey(args.variables), args.updater);
    }


useTestQuery.useClient = () => {
        const qc = useQueryClient();
        const setData = <TData = TestQuery>(qc: QueryClient, args: {
            variables?: TestQueryVariables, 
            updater: Updater<TData|undefined, TData|undefined>
        }) => qc.setQueryData(useTestQuery.getKey(args.variables), args.updater);
        return {setData}
    }`;

        expect(result).toStrictEqual({
            "content": `
export const TestQueryDocument = ${testQueryDocument}
`,
            "prepend": [
                "import { useQuery, useQueryClient, QueryClient, Updater, UseQueryOptions } from '@tanstack/react-query';",
                "import {gql, useSubscription, SubscriptionHookOptions} from '@apollo/client';",
                null
            ]
        });
    });
});
