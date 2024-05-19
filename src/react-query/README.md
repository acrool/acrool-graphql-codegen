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
