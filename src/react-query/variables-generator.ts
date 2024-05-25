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

export function generateQuerySetData(
    node: OperationDefinitionNode,
    documentVariableName: string,
    operationName: string,
    operationResultType: string,
    operationVariablesTypes: string,
    hasRequiredVariables: boolean,
) {

    // @TODO: imagine
    const signature = generateQueryVariablesSignature(hasRequiredVariables, operationVariablesTypes);
    return `\nuse${operationName}.setData = <TData = ${operationResultType}>(qc: QueryClient, args: {
        ${signature}, 
        updater: Updater<TData|undefined, TData|undefined>
    }) => {
        qc.setQueryData(use${operationName}.getKey(args.variables), args.updater);
    }`;
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
        const setData = <TData = ${operationResultType}>(args: {
            ${signature}, 
            updater: Updater<TData|undefined, TData|undefined>
        }) => qc.setQueryData(use${operationName}.getKey(args.variables), args.updater);
        return {setData}
    }`;
}

export function generateMutationKey(node: OperationDefinitionNode): string {
    return `['${node.name.value}']`;
}

export function generateMutationKeyMaker(node: OperationDefinitionNode, operationName: string) {
    return `\nuse${operationName}.getKey = () => ${generateMutationKey(node)};\n`;
}
