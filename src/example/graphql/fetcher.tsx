import {AxiosRequestConfig} from 'axios';

import {useAxiosClient} from '../axios/AxiosClientProvider';

import {getVariablesFileMap, TFileMapVariables} from './utils';

// doc: https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-react-query#usage-example-isreacthook-true
const delay = (ms: number) => new Promise(resolve => {
    setTimeout(() => {
        resolve(true);
    }, ms);
});


export interface IFetchOptions extends AxiosRequestConfig{
    requestCode?: string
}
export interface IUseFetcherArgs<TVariables = {}> {variables?: TVariables, fetchOptions?: IFetchOptions}
export interface IUseSubscriptionArgs<TVariables> {variables?: TVariables}

export const useFetchData = <TData, TArgs extends IUseFetcherArgs<TFileMapVariables>>(
    query: string,
): ((args?: TArgs) => Promise<TData>) => {
    const axiosInstance = useAxiosClient();

    return async (args?: TArgs) => {
        let data: FormData|string|undefined = undefined;
        let contentType: string|undefined = undefined;
        const options = args?.fetchOptions;
        const variables = args?.variables;

        let isMultipartFormData = false;
        if(variables){
            const varOptions = getVariablesFileMap<TArgs['variables']>(variables);
            isMultipartFormData = varOptions.values.length > 0;

            // 如有檔案上傳，變更格式
            if(isMultipartFormData) {
                contentType = 'multipart/form-data';

                const operations = JSON.stringify({
                    query,
                    variables: varOptions.variables
                });

                const graphqlFormOptions = [
                    {name: 'operations', value: operations},
                    {name: 'map', value: JSON.stringify({0: varOptions.map})},
                    ...varOptions.values.map((row, index) => {
                        return {name: index, value: row};
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
            'Content-Type': contentType,
            'Apollo-Require-Preflight': 'true',
            'X-Requested-With': 'XMLHttpRequest',
        };

        const [res] = await Promise.all([
            axiosInstance.post(endpoint, data, {
                ...options,
                headers,
            }),
            delay(400),
        ]);
        return res.data.data;
    };
};
