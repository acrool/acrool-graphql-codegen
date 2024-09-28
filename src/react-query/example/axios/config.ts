import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL: '/graphql',
    timeout: 2 * 60 * 1000,
});
