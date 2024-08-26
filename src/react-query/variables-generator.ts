import {OperationDefinitionNode} from 'graphql';

export function generateQueryVariablesSignature(
    hasRequiredVariables: boolean,
    operationVariablesTypes: string,
): string {
    return `variables${hasRequiredVariables ? '' : '?'}: ${operationVariablesTypes}`;
}
export function generateInfiniteQueryKey(
    node: OperationDefinitionNode,
    hasRequiredVariables: boolean,
): string {
    if (hasRequiredVariables) return `['${node.name.value}.infinite', variables]`;
    return `variables === undefined ? ['${node.name.value}.infinite'] : ['${node.name.value}.infinite', variables]`;
}

export function generateInfiniteQueryKeyMaker(
    node: OperationDefinitionNode,
    operationName: string,
    operationVariablesTypes: string,
    hasRequiredVariables: boolean,
) {
    // @TODO: imagine
    const signature = generateQueryVariablesSignature(false, operationVariablesTypes);
    return `\nuseInfinite${operationName}.getKey = (${signature}) => ${generateInfiniteQueryKey(
        node,
        false,
    )};\n`;
}

export function generateQueryKey(
    node: OperationDefinitionNode,
    hasRequiredVariables: boolean,
): string {
    if (hasRequiredVariables) return `['${node.name.value}', args.variables]`;
    return `args?.variables ? ['${node.name.value}', args.variables]: ['${node.name.value}']`;
}

export function generateQueryGetKey(
    node: OperationDefinitionNode,
    hasRequiredVariables: boolean,
): string {
    if (hasRequiredVariables) return `['${node.name.value}', variables]`;
    return `variables ? ['${node.name.value}', variables]: ['${node.name.value}']`;
}

export function generateQueryKeyMaker(
    node: OperationDefinitionNode,
    operationName: string,
    operationVariablesTypes: string,
    hasRequiredVariables: boolean,
) {
    // @TODO: imagine
    const signature = generateQueryVariablesSignature(false, operationVariablesTypes);
    return `\nuse${operationName}.getKey = (${signature}) => ${generateQueryGetKey(
        node,
        false,
    )};\n`;
}

export function generateQueryClickHook(
    node: OperationDefinitionNode,
    documentVariableName: string,
    operationName: string,
    operationResultType: string,
    operationVariablesTypes: string,
    hasRequiredVariables: boolean,
) {

    // @TODO: imagine
    const signature = generateQueryVariablesSignature(hasRequiredVariables, operationVariablesTypes);

    return `\nuse${operationName}.useClient = () => {
        const qc = useQueryClient();
        const queryKey = use${operationName}.getKey();
        const getQueryKeyVariables = (${signature}) => use${operationName}.getKey(args.variables);
        
        const setData = <TData = ${operationResultType}>(args: {
            ${signature}, 
            updater: Updater<TData|undefined, TData|undefined>
        }) => qc.setQueryData(getQueryKeyVariables(args.variables), args.updater);
        
       
        const invalidate = (${signature}) => qc.invalidateQueries({queryKey: getQueryKeyVariables(variables)});
        const invalidateAll = () => qc.invalidateQueries({queryKey});
        
         const fetchQuery = <TError = unknown>(
      args: IUseFetcherArgs<${operationVariablesTypes}>,
      options?: Partial<UseQueryOptions<${operationResultType}, TError>>
    ) =>
    qc.fetchQuery<${operationResultType}, TError>({
      queryKey: getQueryKeyVariables(args.variables),
      queryFn: useFetchData<${operationResultType}, IUseFetcherArgs<${operationVariablesTypes}>(${documentVariableName}).bind(null, args),
      ...options
    });
        
        return {queryKey, getQueryKeyVariables, setData, invalidate, fetchQuery}
    }`;
}

export function generateMutationKey(node: OperationDefinitionNode): string {
    return `['${node.name.value}']`;
}

export function generateMutationKeyMaker(node: OperationDefinitionNode, operationName: string) {
    return `\nuse${operationName}.getKey = () => ${generateMutationKey(node)};\n`;
}
