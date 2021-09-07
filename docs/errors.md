
### 集群搭建

```
NAME                                 READY   STATUS    RESTARTS   AGE
coredns-7ff77c879f-45srd             0/1     Pending   0          4m32s
coredns-7ff77c879f-pbk9t             0/1     Pending   0          4m32s
etcd-van-master                      1/1     Running   0          9m48s
kube-apiserver-van-master            1/1     Running   0          9m42s
kube-controller-manager-van-master   0/1     Error     0          9m40s
kube-proxy-ztrfn                     0/1     Pending   0          4m32s
kube-scheduler-van-master            0/1     Error     0          9m31s
```

查看日志：

```
$ kubectl describe po kube-scheduler-van-master -n kube-system

Events:
  Type     Reason     Age                From                 Message
  ----     ------     ----               ----                 -------
  Warning  Unhealthy  10m (x4 over 10m)  kubelet, van-master  Liveness probe failed: Get https://127.0.0.1:10259/healthz: dial tcp 127.0.0.1:10259: connect: connection refused

```

kubenetes 容器探针

liveness probe，检查容器是否在运行
 
readiness probe。用于容器的自定义准备状态检查。如果ReadinessProbe检查失败，
Kubernetes会将该Pod从服务代理的分发后端去除，不再分发请求给该Pod。

https://blog.csdn.net/yunweimao/article/details/106880516


#### 某一个节点notReady


使用describe 查看日志
```
$ kubectl describe node localhost.localdomain
```
