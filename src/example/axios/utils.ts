import {AxiosResponse} from 'axios';

import {SystemException} from '@/exception';
import {IFetchOptions} from '@/library/graphql/fetcher';

/**
 * 檢查是否為 Refresh
 * @param config
 */
export const checkIsRefreshTokenAPI = (config: IFetchOptions) => {
    return config.requestCode === 'refreshToken';
};

/**
 * 返回 Axios 格式錯誤
 * @param response
 */
export const getResponseFirstError = (response: AxiosResponse) => {
    return response.data.errors?.[0] ?? undefined;
};


/**
 * 返回 System 格式錯誤
 * @param response
 */
export const getSystemError = (response: AxiosResponse) => {
    const firstError = getResponseFirstError(response);
    return new SystemException({
        message: firstError?.message ?? 'Axios error',
        code: firstError?.code ?? 'ERR_SYS_BAD_RESPONSE',
        path: firstError?.path
    });
};

