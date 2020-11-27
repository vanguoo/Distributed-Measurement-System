## kubernetes的声明式API编程范式
为了能够使得k8s集群工作，都需要编写一个声明了各种API对象的yaml文件交给kubernetes，从而去执行各种工作。
这就叫做**声明式API编程**

与声明式API不同的是，命令式命令行操作，比如Docker Swarm:

```
$ docker service create --name nginx --replicas 2  nginx
$ docker service update --image nginx:1.7.9 nginx
```

而kubernetes的声明式API是这样的：
声明一个Deployment对象：
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80
```

使用kubectl来部署:

```
$ kubectl apply -f nginx.yaml
```

如果需要修改其中的版本参数，则执行：

```
$ kubectl replace -f nginx.yaml
```

#### kubectl replace & kubectl apply

- kubectl replace 的执行过程，是使用新的 YAML 文件中的 API 对象，替换原有的 API 对象
- kubectl apply，则是执行了一个对原有 API 对象的 PATCH 操作。  

apply优点，**一次处理多个写操作，并且具备Merge能力**


### Istio 基于 Kubernetes 项目的微服务治理框架
Istio最核心组件是pod里的Envoy容器
![](https://tva1.sinaimg.cn/large/0081Kckwly1gl18fj5s8oj31hc0u0gmn.jpg)

灰度发布：
比如，Istio 可以调节这个流量从 90%-10%，改到 80%-20%，再到 50%-50%，最后到 0%-100%，就完成了这个灰度发布的过程。

微服务治理的过程中，无论是对 Envoy 容器的部署，还是像上面这样对 Envoy 代理的配置，用户和应用都是完全“无感”的。

### Dynamic Admission Control

当一个 Pod 或者任何一个 API 对象被提交给 APIServer 之后，总有一些“初始化”性质的工作需要在它们被 Kubernetes 项目正式处理之前进行。比如，自动为所有 Pod 加上某些标签（Labels）

...

## API对象的原理


问题：
当我把一个 YAML 文件提交给 Kubernetes 之后，它究竟是如何创建出一个 API 对象的呢？

声明式API的工作原理，如何利用这套API机制，在kubernetes中添加自定义的API对象？

1. 通过版本号查找对象。
如果是核心 API 对象，比如：Pod、Node 等，是不需要 Group 的（即：它们的 Group 是“”）

![](https://tva1.sinaimg.cn/large/0081Kckwly1gl18simbrdj31ek0lrtba.jpg)

2. APIServer 创建这个CronJob对象：

![](https://tva1.sinaimg.cn/large/0081Kckwgy1gl194s483aj31fv0ksk4y.jpg)


- 首先