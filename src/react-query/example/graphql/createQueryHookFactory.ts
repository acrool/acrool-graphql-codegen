import {useLocale} from '@acrool/react-locale';
import {
    keepPreviousData, NoInfer, Updater,
    useInfiniteQuery,
    UseInfiniteQueryOptions,
    useMutation,
    UseMutationOptions,
    useQuery, useQueryClient,
    UseQueryOptions
} from '@tanstack/react-query';


import {IUseFetcherArgs, useFetchData} from './fetcher';


// Query 不同key資料的時候，會保留上一個 queryKey的資料等待覆蓋
export const placeholderData = keepPreviousData;

/**
 * 產生QueryKey
 * @param rootKey
 * @param args
 */
const generateQueryKey = (rootKey: string, args?: Object) => {
    return [rootKey, args ?? {}];
};


/**
 * 產生 useQuery Hook 的工廠方法
 * @param document
 * @param queryKey
 */
export const createQueryHook = <
    TData,
    TVariables extends {},
    TError = unknown
>(
        document: string,
        queryKey: string // 需要傳入對應的 query key
    ) => (
        args?: IUseFetcherArgs<TVariables>,
        options?: Partial<UseQueryOptions<TData, TError, TData>>
    ) => {
        const fetcher = useFetchData<TData, IUseFetcherArgs<TVariables>>(document);
        // const {locale} = useLocale();
        // const localeArgs = args?.fetchOptions?.ignoreLocale ? undefined: locale;
        const localeArgs = 'en-US';

        return useQuery<TData, TError, TData>({
            queryKey: generateQueryKey(queryKey, {...args?.variables, localeArgs,}), // 傳入的 cacheKey
            queryFn: () => fetcher(args),
            ...options
        });
    };



/**
 * 產生 queryClient.fetchQuery 的工廠方法
 * @param document
 * @param queryKey
 */
export const createQueryClient = <
    TData,
    TVariables extends {},
    TError = unknown
>(
        document: string,
        queryKey: string // 需要傳入對應的 query key
    ) => () => {
        const qc = useQueryClient();
        const {locale} = useLocale();
        const fetcher = useFetchData<TData, IUseFetcherArgs<TVariables>>(document);

        /**
         * 取得 QueryKey
         * @param variables
         */
        const getQueryKey = (variables?: IUseFetcherArgs<TVariables>['variables']) => {
        // const localeArgs = args?.fetchOptions?.ignoreLocale ? undefined: locale;
            const localeArgs = 'en-US';
            return generateQueryKey(queryKey, {...variables, localeArgs});
        };

        /**
     * 取得 Query Data
     * (優先使用Cache)
     * @param args
     * @param options
     */
        const fetchQuery = async (
            args?: IUseFetcherArgs<TVariables>,
            options?: Partial<UseQueryOptions<TData, TError, TData>>
        ) => {
            return qc.fetchQuery<TData, TError, TData>({
                queryKey: getQueryKey(args?.variables), // 傳入的 cacheKey
                queryFn: () => fetcher(args),
                ...options
            });
        };

        /**
     * 重新拿取的 QueryData
     * @param args
     * @param options
     */
        const reFetchQuery = async (
            args?: IUseFetcherArgs<TVariables>,
            options?: Partial<UseQueryOptions<TData, TError, TData>>
        ) => {
            await invalidateQueries(args);
            return fetchQuery(args, options);
        };

        /**
         * 設定 QueryData
         * @param variables
         * @param updater
         */
        const setQueryData = (variables: TVariables, updater: Updater<NoInfer<TData> | undefined, NoInfer<TData> | undefined>) => {
            return qc.setQueryData<TData>(getQueryKey(variables), updater);
        };

        /**
     * 過期 QueryData
     * @param args
     */
        const invalidateQueries = async (args?: IUseFetcherArgs<TVariables>) => {
            return qc.invalidateQueries({queryKey: getQueryKey(args?.variables)});
        };

        return {
            getQueryKey,
            fetchQuery,
            reFetchQuery,
            setQueryData,
            invalidateQueries,
        };
    };





/**
 * 產生 useQuery & useFetchQuery Hook 的工廠方法
 * @param document
 * @param queryKey
 */
export const createQueryAndQueryClientHook = <
    TData,
    TVariables extends {},
    TError = unknown
>(
        document: string,
        queryKey: string // 需要傳入對應的 query key
    ) => ({
        useQuery: createQueryHook<TData, TVariables, TError>(document, queryKey),
        useQueryClient: createQueryClient<TData, TVariables, TError>(document, queryKey),
    });



/**
 * 產生 useInfiniteQuery Hook 的工廠方法
 * @param document
 * @param queryKey
 */
export const createInfiniteQueryHook = <
    TData,
    TVariables extends {},
    TError = unknown
>(
        document: string,
        queryKey: string // 需要傳入對應的 query key
    ) => (
        initialPageParam: number,
        getNextPageParam: (lastPage: TData) => number | void, // lastPage 代表上一個 page 的數據
        args?: IUseFetcherArgs<TVariables>,
        options?: Partial<UseInfiniteQueryOptions<TData, TError, {pages: TData[], pageParams: any}>>
    ) => {
        const fetcher = useFetchData<TData, IUseFetcherArgs<TVariables>>(document);
        const {locale} = useLocale();
        // const localeArgs = args?.fetchOptions?.ignoreLocale ? undefined: locale;
        const localeArgs = 'en-US';

        return useInfiniteQuery<TData, TError, {pages: TData[], pageParams: any}>({
            queryKey: generateQueryKey(queryKey, {...args?.variables, localeArgs}),
            queryFn: ({pageParam = initialPageParam}) => fetcher({
                ...args,
                variables: {...args?.variables!, page: pageParam} // 動態傳遞 pageParam 作為頁碼
            }),
            initialPageParam,
            getNextPageParam,
            ...options
        });
    };




/**
 * 產生 useMutation Hook 的工廠方法
 * @param document
 * @param mutationKey
 */
export const createMutationHook = <
    TData,
    TArgs extends {},
    TError = unknown,
    TContext = unknown
>(
        document: string,
        mutationKey: string,
    ) => (
        options?: Partial<UseMutationOptions<TData, TError, IUseFetcherArgs<TArgs>, TContext>>
    ) =>
        useMutation<TData, TError, IUseFetcherArgs<TArgs>, TContext>({
            mutationKey: [mutationKey],
            mutationFn: useFetchData<TData, IUseFetcherArgs<TArgs>>(document),
            ...options
        });

