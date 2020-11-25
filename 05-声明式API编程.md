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

使用kubectl来部署
