import {isEmpty, isNotEmpty} from '@acrool/js-utils/equal';
import {useLocale} from '@acrool/react-locale';
import {AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import React, {createContext, useContext, useLayoutEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {SystemException} from '@/exception';
import {useDispatch} from '@/library/redux';
import {authActions, authHook} from '@/store/main/auth';
import {getTokenInfo} from '@/store/main/auth/utils';

import AxiosCancelException from './AxiosCancelException';
import {axiosInstance} from './config';
import {TInterceptorRequest, TInterceptorResponse} from './types';
import {checkIsRefreshTokenAPI, getResponseFirstError, getSystemError} from './utils';



let pendingRequestQueues: Array<(isRefreshOK: boolean) => void> = [];
let isTokenRefreshing = false;



export const AxiosClientContext = createContext<AxiosInstance>(axiosInstance);
export const useAxiosClient = () => useContext(AxiosClientContext);

interface IProps extends FCChildrenProps{}


const AxiosClientProvider = ({
    children,
}: IProps) => {

    const {locale, i18n} = useLocale();
    const RefreshToken = authHook.useRefreshToken();
    const KitOut = authHook.useKickOut();
    const navigate = useNavigate();
    const dispatch = useDispatch();


    useLayoutEffect(() => {
        // 處理請求回應攔截
        const interceptorReq = axiosInstance.interceptors.request.use(interceptorsRequest);
        const interceptorRes = axiosInstance.interceptors.response.use(interceptorsResponse);

        return () => {
            axiosInstance.interceptors.request.eject(interceptorReq);
            axiosInstance.interceptors.response.eject(interceptorRes);
        };

    }, [isTokenRefreshing]);



    /**
     * 發起 Token Refresh
     */
    const postRefreshToken = () => {
        RefreshToken.mutate(undefined, {
            onSuccess: data => {
                runPendingRequest(true);
            },
            onError: data=> {
                runPendingRequest(false);
            }
        });
    };


    /**
     * 執行所有貯列
     * @param isSuccess 是否成功
     */
    const runPendingRequest = (isSuccess: boolean) => {
        isTokenRefreshing = false; // 注意這個順序
        for(const cb of pendingRequestQueues){
            cb(isSuccess);
        }
        pendingRequestQueues = [];
    };

    /**
     * 新增項目到貯列;
     * @param resolve
     * @param reject
     */
    const pushPendingRequestQueues = (
        resolve: (value: any) => void,
        reject: (value: SystemException) => void
    ) => {
        return (originConfig: InternalAxiosRequestConfig) => {
            pendingRequestQueues.push((isTokenRefreshOK: boolean) => {
                if (isTokenRefreshOK) {
                    resolve(axiosInstance(originConfig));
                } else {
                    reject(new SystemException({
                        message: i18n('errorHttp.401', {def: '請求的API沒有權限'}),
                        code: 'SERVICE_HTTP_401',
                    }));
                }
            });
        };
    };


    /**
     * 請求攔截器
     * @param originConfig
     */
    const interceptorsRequest: TInterceptorRequest = (originConfig) => {

        return new Promise((resolve, reject) => {
            // 設定 Common Header
            const {accessToken} = getTokenInfo();

            // console.log('accessToken', accessToken);

            originConfig.headers['Accept-Language'] = locale;
            originConfig.headers['Authorization'] = isNotEmpty(accessToken) ? `Bearer ${accessToken}`: undefined;


            // 如果不是 RefreshToken API 但又是在進行刷新中，那就儲存請求並取消這次發送
            if(!checkIsRefreshTokenAPI(originConfig) && isTokenRefreshing){
                // 將尚未送出的請求存入貯列
                pushPendingRequestQueues(resolve, reject)(originConfig);

                reject(new AxiosCancelException({message: 'Token refreshing, so request save queues not send', code: 'REFRESH_TOKEN'}));
            }

            resolve(originConfig);
        });
    };


    /**
     * 回應攔截器
     * @param response
     */
    const interceptorsResponse: TInterceptorResponse = (response) => {

        const originalConfig = response.config;
        const error = getResponseFirstError(response);
        const {refreshToken} = getTokenInfo();

        // 判定為錯誤
        if(error){
            if(['WS_FORBIDDEN'].includes(error.code)){
                // 無工作區權限
                dispatch(authActions.changeWorkspace({workspaceId: 'me'}));
                navigate('/fe/dashboard', {replace: true});
            }


            if(error.code === 'UNAUTHENTICATED'){

                // 如果錯誤代碼為 401 UNAUTHENTICATED 但 RefreshToken 又不存在的話，直接登出
                // 如果是 Refresh Token API 失敗，則登出，並取消所有貯列請求
                if(isEmpty(refreshToken) || checkIsRefreshTokenAPI(originalConfig)) {
                    KitOut.mutate();
                    return Promise.reject(getSystemError(response));
                }

                // 如果不是在 Refreshing Token，則發出 Refresh Token 請求
                if(!isTokenRefreshing){
                    isTokenRefreshing = true;

                    postRefreshToken();
                }


                return new Promise((resolve, reject) => {
                    // 將已經發送出去的請求存入貯列
                    pushPendingRequestQueues(resolve, reject)(originalConfig);

                });
            }

            return Promise.reject(getSystemError(response));
        }

        return response;
    };





    return <AxiosClientContext.Provider
        value={axiosInstance}
    >
        {children}
    </AxiosClientContext.Provider>;


};

export default AxiosClientProvider;
