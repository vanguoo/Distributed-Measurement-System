## 创建镜像

#### nodejs服务:

```
├── Dockerfile
├── node_modules
├── package-lock.json
├── package.json
└── server.js
```

Dockerfile:

```
FROM node:13.12.0-alpine
WORKDIR '/app'

COPY package.json /app
RUN npm install
COPY . /app
CMD node server.js
EXPOSE 39002
```

创建镜像：

```
$ docker build -t vanguo996/cpu-percent .  
```

推送到dockerhub:

```
$ docker push vanguo996/cpu-percent
```



#### 前端react

```
FROM node:13.12.0-alpine
WORKDIR '/demo-app'

COPY package.json ./
RUN npm install --registry=https://registry.npm.taobao.org

COPY . .
CMD ["npm","start"]
```



```
$ docker build -t vanguo996/demoreact .  
```



##### 注意

- 要用小的基础镜像:

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gle96lz5ndj30dt09k75q.jpg" alt="scal" style="zoom:50%;" />

#### 原理

> 所有原理图来自:  *Kubernetes in action*

镜像的构建过程不是在客户端完成的，而是将整个目录文件上传到**docker守护进程**

> 注意，docker客户端和守护进程不一定在同一台机器，如果是非linux操作系统中使用docker，那么守护进程运行在虚拟机内。
>
> 比如mac上的守护进程在docker-machine中



![](https://tva1.sinaimg.cn/large/0081Kckwly1gleg9cog4gj30mv0edmyk.jpg)



镜像分层，有利于复用。

![](https://tva1.sinaimg.cn/large/0081Kckwly1glege43afpj30ju08haar.jpg)





## docker 容器间通信

启动cpu-percent server

```
$ docker run -d --name cpu -p 39002:39002 vanguo996/cpu-percent
2b761ff4849572e55a9dca60062cbe3e55ed1b84b3117ffe2ef66be2e2827894
```



启动 react前端

```
$ docker run -d --name react-frontend -p 3000:3000 vanguo996/demoreact
5dfc0de0c14aa0d7687e9ce52696d963a31ab9227ec1e33ddc2ae07b7c27b2f8
```



两者通过websocket连接，端口为39002

默认情况下，镜像名称是latest。如果在本地没有此镜像，那么就docker.io的镜像中心拉取。

<img src="https://tva1.sinaimg.cn/large/0081Kckwly1gleg5kptmuj30n40b1jsr.jpg" alt="s" style="zoom:80%;" />







## kubernetes容器编排





kubernetes是一种容器编排工具，在分布式系统中更系统地管理容器。

kubectl 运行在本地客户端，客户端使用RESTful API 与 k8s集群中的“大脑”— *API Server* 通信。



<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1glegh2bzmnj30kv0fygne.jpg" style="zoom:80%;" />



### 部署pod

pod是k8s基本的调度对象，一个pod中有多个container，当然也可以只存在一个container。

![](https://tva1.sinaimg.cn/large/0081Kckwgy1glegouj58bj30ka0913z9.jpg)



接下来，部署pod有两种方式:

- 命令行方式

  kubectl run 

  ```
  Examples:
    # Start a nginx pod.
    kubectl run nginx --image=nginx
  ```

- yaml声明式

  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: ms-frontend
    namespace: default
    labels:
      app: ms-frontend
  spec:
    containers:
    - name: ms-frontend    
      image: "vanguo996/demoreact"
      ports:
      - containerPort:  3000
        name:  http
  ```

  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: cpu-pod
    namespace: default
    labels:
      app: cpu-pod
  spec:
    containers:
    - name: cpu-pod
      image: "vanguo996/cpu-percent"
      ports:
      - containerPort:  39002
        name:  http
  
  ```

  

yaml文件生效：

```sh
$ kubectl create -f pod-deploy.yaml
pod/ms-frontend created
```



```sh
$ kubectl get pods -w
NAME          READY   STATUS    RESTARTS   AGE
cpu-pod       1/1     Running   0          24s
ms-frontend   1/1     Running   0          10m
```



原理图：

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1glegknjneej30o70hsq5a.jpg" alt="d" style="zoom:80%;" />



### 访问应用

```sh
$ kubectl expose pod ms-frontend --type=LoadBalancer --name ms-frontend
service/ms-frontend exposed
```

```sh
$ kubectl get svc
NAME          TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
kubernetes    ClusterIP      10.96.0.1        <none>        443/TCP          4d5h
ms-frontend   LoadBalancer   10.109.167.162   <pending>     3000:31932/TCP   36s
```



> 疑问：在loadBalancer模式，外部ip一直在pending状态



在加入**Service API 对象**以后，可以使用外部端口访问容器，原理可以通过下图描述：



![](https://tva1.sinaimg.cn/large/0081Kckwly1glegmy3v80j30km079752.jpg)



通过声明式来创建Service API对象:

```yaml
apiVersion: v1
kind: Service
metadata:
  name:  react-nodeport
  namespace: default
spec:
  selector:
    app: demo-react
  type: NodePort
  ports:
  - name: demo-react
    port: 80
    targetPort: 3000
    protocol: TCP
```



```sh
$ kubectl create -f react-service.yaml
service/react-nodeport created
$ kubectl get svc
NAME             TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
react-nodeport   NodePort       10.106.235.138   <none>        80:30084/TCP     35s
```









### 玩转Pod

一个应用程序由多个进程组成，在运行期间，一定需要进程间通信。

![](https://tva1.sinaimg.cn/large/0081Kckwly1gleg4gt2v6j30kb08njsa.jpg)







Pod间通信



```yaml
apiVersion: v1
kind: Service
metadata:
  name:  demo-react
  namespace: default
spec:
  selector:
    app: demo-react
  type: NodePort
  ports:
  - name: demo-react
    port: 80
    targetPort: 3000
    nodePort: 30123
```



