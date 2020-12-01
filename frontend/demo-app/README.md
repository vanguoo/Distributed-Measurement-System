## 在kubernetes上运行应用

运行创建、推送到docker-hub上的镜像，

```
$ kubectl run demoreact --image=vanguo996/demoreact --port=3000
pod/demoreact created

$ kubectl get pods
NAME        READY   STATUS    RESTARTS   AGE
demoreact   1/1     Running   0          117s

```

> 为节点打上"污点"
> ```
>$ kubectl taint nodes van-node1 foo=bar:NoSchedule
>node/van-node1 tainted
>```

默认情况下，master节点是不允许运行用户pod的，kubernetes依靠的是taint/toleration机制
一旦某个节点加上了taint，那么所有的pod都不能在这个节点运行，

获取pod信息：
```
$ kubectl describe pods demoreact
Name:         demoreact
Namespace:    default
Priority:     0
Node:         van-master/192.168.0.101
Start Time:   Mon, 30 Nov 2020 10:14:38 +0800
Labels:       run=demoreact
Annotations:  <none>
Status:       Running
IP:           10.44.0.1
IPs:
  IP:  10.44.0.1
  ...
```


### 访问web应用


