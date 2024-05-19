# @acrool/graphql-codegen-react-query

[Improved graphql-codegen Hook](https://medium.com/@imaginechiu/improved-graphql-codegen-hook-4606cee4c29c)
Adjustments based on the original @graphql-codegen/typescript-react-query

- add getKey not variables and options variables
- modify variables to object variables and fetchOptions 

## Install

```bash
$ yarn add @acrool/graphql-codegen-react-query -D
```


## Setting

codegen.ts

```typescript
import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
    schema: [
        './schema.graphql',
        'scalar Upload'
    ],
    documents: [
        './src/store/{main,custom}/**/doc.gql',
    ],
    generates: {
        './src/library/graphql/__generated__.ts': {
            plugins: [
                'typescript',
                'typescript-operations',
                '@acrool/graphql-codegen-react-query',
            ],
        },
    },
    config: {
        exposeQueryKeys: true,
        fetcher: {
            func: './fetcher#useFetchData',
            isReactHook: true,
        }
    }
}
```



## Fetcher

```ts
import {AxiosRequestConfig} from 'axios';

import {useAxiosClient} from '@/library/axios/AxiosClientProvider';

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
export interface IUseFetcherArgs<TVariables> {variables?: TVariables, fetchOptions?: IFetchOptions}
export interface IUseSubscriptionArgs<TVariables> {variables?: TVariables}

export const useFetchData = <TData, TArgs extends IUseFetcherArgs<TFileMapVariables>>(
    query: string,
): ((args?: TArgs) => Promise<TData>) => {
    const axiosInstance = useAxiosClient();

    return async (args?: TArgs) => {
        let data: FormData | string;
        let contentType: string;
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

```

## Usage

```typescript
const DropFileUpload = () => {
    const qc = useQueryClient();
    const UploadFile = useTaskFileUploadMutation();
    const Tasks = useTasksQuery();

    const handleOnUpload: TOnUpload = async (file: any, options) => {

        try {
            const res = await UploadFile.mutateAsync({
                variables: {
                    taskId,
                    file,
                },
                fetchOptions: {
                    onUploadProgress: options.onUpdateProgress,
                },
            });

            qc.invalidateQueries(useTasksQuery.getKey());
            qc.setQueryData<ITaskFilesQuery>(useTaskFilesQuery.getKey({taskId}), ((oldData) => {
                return produce(oldData, draft => {
                    draft.taskFiles = push(draft.taskFiles, res.taskFileUpload.newData);
                });
            }));
            options.onUploadDone();

        }catch (e){
            if(e instanceof SystemException) {
                options.onUploadFail(e.message);
            }
        }

    };
}

```



## License

MIT © [acrool](https://github.com/acrool)
