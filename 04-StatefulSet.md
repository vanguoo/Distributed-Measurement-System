## 有状态应用 & 无状态应用

Deployment实际上不足以覆盖所有的应用编排问题，因为

它认为，一个应用的所有Pod是完全一样的，它们相互之间没有顺序，无所谓运行在哪台宿主机。
但是在实际场景中，不是所有应用都可以满足要求。

**尤其在分布式场景中，多个应用实例之间是有依赖关系的，比如主从关系，主备关系**

这种实例之间的不对等关系，叫做**有状态应用(Staful Application)**

得益于“控制器模式”的设计思想，Kubernetes 项目很早就在 Deployment 的基础上，扩展出了对“有状态应用”的初步支持。这个编排功能，就是：StatefulSet。

StatefulSet 的核心功能，就是通过某种方式记录这些状态，然后在 Pod 被重新创建时，能够为新 Pod 恢复这些状态。

### Headless Serivce

Service 是 Kubernetes 项目中用来将一组 Pod 暴露给外界访问的一种机制。比如，一个 Deployment 有 3 个 Pod，那么我就可以定义一个 Service。然后，用户只要能访问到这个 Service，它就能访问到某个具体的 Pod。

service作用，

1. 防止Pod失联(服务发现)
因为Pod每次创建都对应一个IP地址，而这个IP地址是短暂的，每次随着Pod的更新都会变化，假设当我们的前端页面有多个Pod时候，同时后端也多个Pod，这个时候，他们之间的相互访问，就需要通过注册中心，拿到Pod的IP地址，然后去访问对应的Pod

2. 定义Pod访问策略(负载均衡)
页面前端的Pod访问到后端的Pod，中间会通过Service一层，而Service在这里还能做负载均衡，负载均衡的策略有很多种实现策略，例如：随机、轮询、响应比

这里Pod 和 Service之间还是根据 label 和 selector 建立关联的，


### service常用类型
- ClusterIp：集群内部访问
- NodePort：对外访问应用使用
- LoadBalancer：对外访问应用使用，公有云

导出文件，查看service信息：
```
kubectl expose deployment web --port=80 --target-port=80 --dry-run -o yaml > service.yaml
```

```
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    app: web
  name: web
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
  selector:
    app: web
status:
  loadBalancer: {}
```
如果没有设置，那么就是第一种方式-ClusterIP，只能在集群内部通信

selector中设置：
```
type: NodePort
```

