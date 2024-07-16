# Acrool Graphql Codegen

> graphql code generator plugins

## Plugins

[@acrool/graphql-codegen-react-query](https://github.com/acrool/acrool-graphql-codegen/tree/main/src/react-query)


## Changelog

### 2024/05/25

- setData method
- add useClientHook

```tsx
const gnatt = () => {
    const ProjectsTaskWithGanttQuery = useProjectsTaskWithGanttQuery.useClient();
    
    const onSubmit = (data) => {
        ProjectsTaskWithGanttQuery.setData(data);
    }
    //... ignore code
}
```

## License

MIT © [acrool](https://github.com/acrool)
