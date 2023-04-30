import {parse, buildSchema} from 'graphql';
import {plugin} from '../index';



const basicDoc = parse(/* GraphQL */ `
    query test {
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
    mutation test($name: String) {
        submitRepository(repoFullName: $name) {
            id
        }
    }
`);

const subscriptionDoc = parse(/* GraphQL */ `
    subscription test($name: String) {
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

    it('Should greet', async () => {
        const result = await plugin(schema, docs, {
            // name: 'bear-react-query'
        });

        expect(result).toStrictEqual({
            "content": "\nexport const TestDocument = `\n    query test {\n  feed {\n    id\n    commentCount\n    repository {\n      full_name\n      html_url\n      owner {\n        avatar_url\n      }\n    }\n  }\n}\n    `;\nexport const useTestQuery = <\n      TData = TestQuery,\n      TError = unknown\n    >(\n      args?: IUseFetcherArgs<TestQueryVariables>,\n      options?: UseQueryOptions<TestQuery, TError, TData>\n    ) =>\n    useQuery<TestQuery, TError, TData>(\n      args?.variables ? ['test', args.variables]: ['test'],\n      fetch<TestQuery, IUseFetcherArgs<TestQueryVariables>>(TestDocument, args),\n      options\n    );",
            "prepend": [
                "import { useQuery, UseQueryOptions } from '@tanstack/react-query';",
                null
            ]
        });
    });
});
