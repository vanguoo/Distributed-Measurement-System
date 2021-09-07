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

关于更多Service介绍:  
[Service](#Service)

![](https://tva1.sinaimg.cn/large/0081Kckwly1glegmy3v80j30km079752.jpg)



#### Service API 

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



#### 向pod发送请求

在需要测试调试pod的时候如何发送信息到pod？

```sh
$ kubectl port-forward ms-frontend 3001:3000
Forwarding from 127.0.0.1:3001 -> 3000
Forwarding from [::1]:3001 -> 3000
```

![](https://tva1.sinaimg.cn/large/0081Kckwly1glf1uh5zhij30k60643z1.jpg)





### 了解Pod

一个应用程序由多个进程组成，在运行期间，一定需要进程间通信。

因为不能将多个进程聚集在单独容器中(本质上容器就是一种进程)，需要另一种更加高级的结构来绑定容器，作为一个单元进行管理。在pod中可以运行密切相关的容器，同时还能有隔离效果。

#### pod间通信

由于pod中的容器运行与相同的network命名空间中，因此它们共享相同的IP地址和端口空间。所以

- pod中容器不能绑定到相同端口号
- 不同pod中的容器不会遇到端口冲突
- 同一pod中的容器可以用localhost进行通信

pod不能跨节点工作：

![](https://tva1.sinaimg.cn/large/0081Kckwly1gleg4gt2v6j30kb08njsa.jpg)



pod不论在单一还是不同的工作节点上，**不管实际节点之间的网络拓扑结构是如何**， 这些pod之间的容器都可以像没有NAT的平坦网络之间通信。

![](https://tva1.sinaimg.cn/large/0081Kckwgy1glf14jnlvbj30ia09wmxw.jpg)



#### pod容器管理

pod是一个逻辑主机，可以说pod是一种轻量化的虚拟主机，

1. 将应用程序组织到多个pod中

- 提高基础架构利用率

如果有两个节点的集群，只有一个单独的pod，那么始终只会用到一个节点，所以更合理的做法是把两个容器拆分到不同pod上，合理分配计算资源。

- 由于扩容考虑

前端组件和后端组价具有完全不同的扩缩容需求，需要安排在不同的pod中

2. 在pod中使用多个容器



![](https://tva1.sinaimg.cn/large/0081Kckwgy1glf1qw64fvj30ie0cdabq.jpg)



## Service

微服务的集群中，pod需要对来自集群内其他pod或者集群外部的客户端HTTP请求作出响应。

需要service的原因：

- pod具有很大的不确定性，它们会因为升级，或者扩缩容导致重启或者关闭，
- k8s在启动前会给已经调度好的pod分配ip地址，客户端并不知道这个地址
- 水平伸缩(Horizontal scaling) 导致相同的服务有多个ip地址，Servie API 对象可以是的客户端通过一个单一的ip地址对服务进行访问



![](https://tva1.sinaimg.cn/large/0081Kckwly1glf2kr9ptpj30jn0e0dhd.jpg)

通过标签可以选择那些pod创建服务



![](https://tva1.sinaimg.cn/large/0081Kckwly1glf2m6nrkdj30l208u0tl.jpg)

在[之前](#Service-API)创建好的Service中，ClusterIP表示在集群中可以访问此服务。

在运行的容器中执行命令：





![](https://tva1.sinaimg.cn/large/0081Kckwly1glf2oowabvj30na0d5q4s.jpg)


P