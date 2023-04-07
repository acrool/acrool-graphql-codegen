# @bear-graphql-codegen/react-query

> graphql code generator plugins

[Improved graphql-codegen Hook](https://medium.com/@imaginechiu/improved-graphql-codegen-hook-4606cee4c29c)
Adjustments based on the original @graphql-codegen/typescript-react-query

## Install

```bash
# react-query
yarn add @bear-graphql-codegen/react-query -D
```


## Usage

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
                '@bear-graphql-codegen/react-query',
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



## License

MIT © [imagine10255](https://github.com/imagine10255)
