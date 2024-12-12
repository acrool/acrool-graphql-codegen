import {OperationDefinitionNode} from 'graphql';

export interface FetcherRenderer {
  generateFetcherImplementaion: () => string;
  generateSubscriptionHook: (
    node: OperationDefinitionNode,
    documentVariableName: string,
    operationName: string,
    operationResultType: string,
    operationVariablesTypes: string,
    hasRequiredVariables: boolean,
  ) => string;

}
