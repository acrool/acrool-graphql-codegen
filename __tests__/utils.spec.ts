import {plugin} from '../src';
import {parse, buildSchema} from 'graphql';



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
            authLogin(input: WorkspaceCreateInput!): String!
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

        expect(result).toBe('Hello Dotan!');
    });
});
