import {ApolloClient, InMemoryCache, split} from '@apollo/client';
import {GraphQLWsLink} from '@apollo/client/link/subscriptions';
import {getMainDefinition} from '@apollo/client/utilities';
import {createClient} from 'graphql-ws';

import {getTokenInfo} from '@/store/main/auth/utils';


export const refreshingHeaderKey = 'X-Refresh-Token';


// get http or https method from window.location.protocol

const ssl = window.location.protocol === 'https:';
const wsProtocol = ssl ? 'wss' : 'ws';

const wsLink = new GraphQLWsLink(createClient({
    url: `${wsProtocol}://${window.location.host}/graphql`,
    connectionParams: async () => {
        const {accessToken} = getTokenInfo();
        return {
            Authorization: `Bearer ${accessToken}`,
        };
    },
}));

// The split function takes three parameters:
//
// * A function that's called for each operation to execute
// * The Link to use for an operation if the function returns a "truthy" value
// * The Link to use for an operation if the function returns a "falsy" value
const splitLink = split(
    ({query}) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
);



const apolloClient = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache()
});


export default apolloClient;
