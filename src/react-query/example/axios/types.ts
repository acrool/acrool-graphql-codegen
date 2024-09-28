import {AxiosResponse, InternalAxiosRequestConfig} from 'axios';

export type TInterceptorRequest = (value: InternalAxiosRequestConfig<any>) => InternalAxiosRequestConfig<any> | Promise<InternalAxiosRequestConfig<any>>;
export type TInterceptorResponse = (value: AxiosResponse<any>) => AxiosResponse<any> | Promise<AxiosResponse<any>>;
