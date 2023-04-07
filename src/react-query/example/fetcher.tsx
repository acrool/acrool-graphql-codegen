// @ts-ignore
import {AxiosRequestConfig} from 'axios';
import {getVariablesFileMap, TFileMapVariables} from './utils';
import {apiService} from './api-service';

// doc: https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-react-query#usage-example-isreacthook-true
const delay = (ms: number) => new Promise(resolve => {
    setTimeout(() => {
        resolve(true);
    }, ms);
});


export interface IUseFetcherArgs<TVariables> {variables?: TVariables, fetchOptions?: AxiosRequestConfig}

export const useFetchData = <TData, TArgs extends IUseFetcherArgs<TFileMapVariables>>(
    query: string,
): ((args?: TArgs) => Promise<TData>) => {
    const accessToken = undefined;

    return async (args?: TArgs) => {
        let data: FormData | string;
        let contentType: string;
        const options = args?.fetchOptions;
        const variables = args?.variables;

        let isMultipartFormData = false;
        if(variables){
            const varOptions = getVariablesFileMap<TArgs['variables']>(variables);
            isMultipartFormData = varOptions.values.length > 0;

            if(isMultipartFormData) {
                contentType = 'multipart/form-data';

                const operations = JSON.stringify({
                    query,
                    variables: varOptions.variables
                });

                const graphqlFormOptions = [
                    {
                        name: 'operations',
                        value: operations
                    },
                    {
                        name: 'map',
                        value: JSON.stringify({0: varOptions.map})
                    },
                    ...varOptions.values.map((row, index) => {
                        return {
                            name: index,
                            value: row
                        };
                    }),
                ];

                data = new FormData();
                graphqlFormOptions.forEach(row => {
                    (data as FormData).append(row.name.toString(), row.value);
                });

            }
        }

        if(!isMultipartFormData){
            contentType = 'application/json';
            data = JSON.stringify({query, variables});
        }

        const endpoint = '/';
        const headers = {
            'Authorization': accessToken ? `Bearer ${accessToken}`: undefined,
            'Content-Type': contentType,
            'X-Requested-With': 'XMLHttpRequest',
        };

        const [res] = await Promise.all([
            apiService.post(endpoint, data, {
                ...options,
                headers,
            }),
            delay(400),
        ]);


        return res.data.data;

    };
};
