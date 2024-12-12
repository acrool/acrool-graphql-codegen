# Acrool Graphql Codegen Plugins - react-query

<p align="center">
    This is a graphql code generator plugins use react hooks
</p>

<div align="center">

[![NPM](https://img.shields.io/npm/v/@acrool/graphql-codegen-react-query.svg?style=for-the-badge)](https://www.npmjs.com/package/@acrool/graphql-codegen-react-query)
[![npm](https://img.shields.io/bundlejs/size/@acrool/graphql-codegen-react-query?style=for-the-badge)](https://github.com/acrool/@acrool/graphql-codegen-react-query/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/l/@acrool/graphql-codegen-react-query?style=for-the-badge)](https://github.com/acrool/react-picker/blob/main/LICENSE)

[![npm downloads](https://img.shields.io/npm/dm/@acrool/graphql-codegen-react-query.svg?style=for-the-badge)](https://www.npmjs.com/package/@acrool/graphql-codegen-react-query)
[![npm](https://img.shields.io/npm/dt/@acrool/graphql-codegen-react-query.svg?style=for-the-badge)](https://www.npmjs.com/package/@acrool/graphql-codegen-react-query)

</div>


## Features

- Graphql code generator plugins
- Quickly output grpahql .gql to react-query hooks
- Directly customize using `react-query` methods, such as: `useQuery`, `useMutation`, `useInfiniteQuery`
- Use `createQueryAndQueryClientHook` to generate `useQuery`, functions related to `useQueryClient`, such as `getQueryKey`, `fetchQuery`, `reFetchQuery`, `setQueryData`, `invalidateQueries`


## Install

```bash
yarn add -D @acrool/graphql-codegen-react-query
```

## Usage


add package.json script

```json
{
  "scripts":{
    "generate": "graphql-codegen --config ./codegen.ts"
  }
}
```


./codegen.ts

```ts
import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
    schema: [
        './schema.graphql',
        'scalar Upload'
    ],
    documents: [
        './src/store/fragment.gql',
        './src/store/{main,custom}/**/{doc,subscription}.gql',
    ],
    config: {
        maybeValue: "T | undefined",
        inputMaybeValue: "T | null",
    },
    generates: {
        './src/library/graphql/__generated__.ts': {
            plugins: [
                // https://the-guild.dev/graphql/codegen/plugins/typescript/typescript
                'typescript',
                // https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-operations
                'typescript-operations',
                '@acrool/graphql-codegen-react-query',
                {
                    add: {
                        content: `
import {ReadStream} from 'fs-capacitor';
import {EDataLevel} from '@acrool/react-gantt';

interface GraphQLFileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream(options?:{encoding?: string, highWaterMark?: number}): ReadStream;
}`
                    }
                },
            ],
            config: {
                typesPrefix: 'I',
                enumPrefix: false,
                declarationKind: 'interface',
                withMutationFn: true,
                strictScalars: false,
                skipTypename: true,
                inputValue: true,
                // avoidOptionals: true,
                // ignoreEnumValuesFromSchema: false,
                scalars: {
                    Upload: 'Promise<GraphQLFileUpload>',
                    ID: 'string',
                    IP: 'string',
                    UUID: 'string',
                    Role: 'Role',
                    Time: 'string',
                    FileData: 'string',
                    PeriodUnit: 'string',
                    Duration: 'number',
                    Locale: 'string',
                    TransactionID: 'string',
                    // OrderBy: `'desc'|'asc'`,
                    OrderBy: 'string',
                    Timestamp: 'string',
                },
                omitOperationSuffix: true,
                exposeDocument: false,
                exposeQuerySetData: true,
                exposeQueryClientHook: true,
                exposeFetcher: true,
                fetcher: {
                    queryFunc: './createQueryHookFactory#createQueryHook',
                    queryAndQueryClientFunc: './createQueryHookFactory#createQueryAndQueryClientHook',
                    infiniteQueryFunc: './createQueryHookFactory#createInfiniteQueryHook',
                    mutationFunc: './createQueryHookFactory#createMutationHook',
                    isQueryAndQueryClient: true,
                }
            }
        },
    },
}

export default config
```

copy ./src/example in your project lib path

add your gql file

run script

```bash
yarn generate
```





## Release

```bash
yarn build:react-query && npm publish ./src/react-query --access=public
yarn build:qtk-query && npm publish ./src/rtk-query --access=public
```

- [@acrool/graphql-codegen-react-query](https://github.com/acrool/acrool-graphql-codegen/tree/main/src/react-query)
- [Example](./src/example)


## License

MIT © [acrool](https://github.com/acrool)
