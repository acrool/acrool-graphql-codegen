// @ts-ignore
import axios, {AxiosError, AxiosInstance} from 'axios';

export const apiService: AxiosInstance = axios.create({
    baseURL: '/graphql',
    timeout: 2 * 60 * 1000,
});

apiService.interceptors.request.use(
    (config) => new Promise(resolve => {
        resolve(config);
    }),
    (error) => {
        Promise.reject(error);
    },
);


const responseOnError = (error: AxiosError<{
    errors: Array<{
        code: string,
        message: string,
    }>
}>) => {

    const originalRequest = error.config;

    if(!originalRequest){
        return Promise.reject(originalRequest);
    }
    if(error.response.data?.errors){
        // @ts-ignore
        switch (error.response.data.errors[0]?.code) {
        case 'UNAUTHENTICATED':

        default:
        }

        Promise.reject(error.response);
    }

    throw new Error(error.message);
};

apiService.interceptors.response.use(
    (response) => {
        if(response.data?.errors){
            return Promise.reject(responseOnError(new AxiosError(
                response.data.errors,
                'ERR_BAD_RESPONSE',
                response.config,
                response.request,
                response,
            )));
        }

        return response;
    },
    responseOnError
);


