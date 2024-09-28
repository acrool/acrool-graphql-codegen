## Refresh token

1. multi api (a_api, b_api, c_api) call
   1. result: 
      1. a_api: 401
      2. b_api: 401
      3. c_api: 401
    ```
   isRefreshingToken = false
   pendingRequestQueues = []
   
   a_api -> 401 -> onError(401)
   if(isRefreshingToken & isNotEmpty(refreshToken)) = true
     run postRefresh
     isRefreshingToken = true
      
   b_api & c_api -> onError(401)
   if(isRefreshingToken & isNotEmpty(refreshToken)) = false
     add to pendingRequestQueues
   
   --
   a_api reshing success (replace accessToken)
   retry a_api and pendingRequestQueues<b_api, c_api>
   isRefreshingToken = false
   
   a_api reshing fail
   logout
   
   a_api reshing success
   retry a_api fail
   logout
   ```
      