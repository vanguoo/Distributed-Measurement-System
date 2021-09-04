## Abstract

An Operator is a way to package, run, and maintain a Kubernetes application

Operator builds on Kubernetes abstractions to **automate the entire lifecycle** of the software it manages

For developer, Operators make it easier to deploy and run the foundation services on which their apps depend

Operators provide a consistent way to distribute software on Kubernetes clusters and reduce support burdens by identifying and correcting application problems before the pager beeps.



### How Kubernetes Works

Kubernetes automates the lifecycle of a stateless application, such as a static web server. Without state, any instances of an application are interchangeable. This simple web server retrieves files and sends them on to a visitor’s browser. Because the server is not tracking state or storing input or data of any kind, when one server instance fails, Kubernetes can replace it with another. Kubernetes refers to these instances, each a copy of an application running on the cluster, as *replicas*.

A Kubernetes cluster is a collection of computers, called *nodes*. All cluster work runs on one, some, or all of a cluster’s nodes. The basic unit of work, and of replication, is the *pod*. A pod is a group of one or more Linux containers with common resources like networking, storage, and access to shared memory.

At a high level, a Kubernetes cluster can be divided into two planes. The *control plane* is, in simple terms, Kubernetes itself. A collection of pods comprises the control plane and implements the Kubernetes application programming interface (API) and cluster orchestration logic.

The *application plane*, or *data plane*, is everything else. It is the group of nodes where application pods run. One or more nodes are usually dedicated to running applications, while one or more nodes are often sequestered to run only control plane pods. As with application pods, multiple replicas of control plane components can run on multiple controller nodes to provide **redundancy**.

The *controllers* of the control plane implement control loops that repeatedly compare the desired state of the cluster to its actual state. When the two diverge, a controller takes action to make them match. Operators extend this behavior. The schematic in Figure 1-1 shows the major control plane components, with worker nodes running application workloads

![](https://tva1.sinaimg.cn/large/0081Kckwgy1glb6c62kjdj31020u0gou.jpg)

While a strict division between the control and application planes is a convenient mental model and a common way to deploy a Kubernetes cluster to segregate work‐loads, the control plane components are a collection of pods running on nodes, like any other application. In small clusters, control plane components are often sharing the same node or two with application workloads



The conceptual model of a cordoned control plane isn’t quite so tidy, either. The **kubelet** agent running on every node is part of the control plane, for example. Likewise, an Operator is a type of controller, usually thought of as a control plane component.**Operators can blur this distinct border between planes**, however. Treating the control and application planes as isolated domains is a helpful simplifying abstraction, not an absolute truth.



### Stateful Is Hard

...

### Operators Are Software SREs

Site Reliability Engineering (SRE) is a set of patterns and principles for running large systems. Originating at Google, SRE has had a pronounced influence on industry practice. Practitioners must interpret and apply SRE philosophy to particular circumstances, but a key tenet is automating systems administration by writing software to run your software. Teams freed from rote maintenance work have more time to create new features, fix bugs, and generally improve their products.



### How Operators Work

Operators work by extending the Kubernetes control plane and API. In its simplest form, an Operator adds an endpoint to the Kubernetes API, called a *custom resource* (CR), along with a control plane component that monitors and maintains resources of the new type. This Operator can then take action based on the resource’s state. This is illustrated in Figure 1-2

![](https://tva1.sinaimg.cn/large/0081Kckwgy1glb6mvxe1pj312e0tsn14.jpg)



### Kubernetes CRs

CRs are the API extension mechanism in Kubernetes. A *custom resource definition* (CRD) defines a CR;  it’s analogous to a schema for the CR data. Unlike members of the official API, a given CRD doesn’t exist on every Kubernetes cluster. CRDs extend the API of the particular cluster where they are defined. CRs provide endpoints for reading and writing structured data. A cluster user can interact with CRs with kubectl or another Kubernetes client, just like any other API resource.



Kubernetes compares a set of resources to reality; that is, the running state of the cluster. It takes actions to make reality match the desired state described by those resources. Operators extend that pattern to specific applications on specific clusters.**An Operator is a custom Kubernetes controller watching a CR type and taking application-specific actions to make reality match the spec in that resource**. Making an Operator means creating a CRD and providing a program that runs in a loop watching CRs of that kind. What the Operator does in response to changes in the CR is specific to the application the Operator manages. The actions an Operator performs can include almost anything: scaling a complex app, application version upgrades, or even managing kernel modules for nodes in a computational cluster with specialized hardware.



### Who Are Operators For?

The Operator pattern arose in response to infrastructure engineers and developers wanting to extend Kubernetes to provide features specific to their sites and software. **Operators make it easier for cluster administrators to enable**, and developers to use, foundation software pieces like databases and storage systems with less management overhead. If the “killernewdb” database server that’s perfect for your application’s backend has an Operator to manage it, you can deploy killernewdb without needing to become an expert killernewdb DBA.

Application developers build **Operators to manage the applications they are delivering, simplifying the deployment and management experience on their customer's Kubernetes clusters**. Infrastructure engineers create Operators to control deployed services and systems.







## etcd-operator

示例文件：

```
$ git clone https://github.com/kubernetes-operators-book/chapters.git
cd ch03
```



```
├── etcd-cluster-cr.yaml
├── etcd-operator-crd.yaml
├── etcd-operator-deployment.yaml
├── etcd-operator-rolebinding.yaml
├── etcd-operator-role.yaml
└── etcd-operator-sa.yaml
```



创建一个CRD:

```
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  name: etcdclusters.etcd.database.coreos.com
spec:
  group: etcd.database.coreos.com
  names:
    kind: EtcdCluster
    listKind: EtcdClusterList
    plural: etcdclusters
    shortNames:
    - etcdclus
    - etcd
    singular: etcdcluster
  scope: Namespaced
  versions:
  - name: v1beta2
    served: true
    storage: true
```





```sh
$ kubectl create -f etcd-operator-crd.yaml
customresourcedefinition.apiextensions.k8s.io/etcdclusters.etcd.database.coreos.com created
```



```sh
$ kubectl get crd
etcdclusters.etcd.database.coreos.com         2020-12-04T02:49:22Z
```



#### 身份认证：定义operator的Service Account

#### 创建sa：

```
kubectl create -f etcd-operator-sa.yaml
```



```
$ kubectl get sa
NAME               SECRETS   AGE
default            1         17h
etcd-operator-sa   1         8s
```





```sh
$ kubectl describe sa etcd-operator-sa
Name:                etcd-operator-sa
Namespace:           default
Labels:              <none>
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   etcd-operator-sa-token-hgxr8
Tokens:              etcd-operator-sa-token-hgxr8
Events:              <none>
```



查看自定义ServiceAccount秘钥

```
$ kubectl describe secret etcd-operator-sa-token-hgxr8
Name:         etcd-operator-sa-token-hgxr8
Namespace:    default
[...]
ca.crt:     1025 bytes
namespace:  7 bytes
```



#### 关于ServiceAccount

多个pod可以使用同一个sa，pod只能使用同一命名空间中的sa

pod的manifest文件中，可以指定账户名称的方式将一个sa赋值给pod，不指定则是默认的sa

可以通过将不同的sa赋值给pod**来控制每个pod可以访问的资源**。

当api服务器接受到带有认证token的请求，服务器会用token来验证发送请求的客户端所关联的sa是否允许执行请求操作。

api服务器通过管理员配置好的系统级别认证插件来获取这些信息，这个插件就是rbac。



#### 了解RBAC

rbac授权插件将用户角色作为决定用户能否执行操作的关键因素。如果用户有多个角色，用户能够做对应角色能够做的事情。

- role 指定了在资源上恶意执行哪些动词
- rolebinding 绑定到特定用户、组或者ServiceAccount上





#### role

role资源定义了哪些操作(HTTP请求)可以在哪些资源(RESTful 资源)上进行，它允许用户获取并列出了此命名空间中的服务。

```
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: etcd-operator-role
rules:
- apiGroups:
  - etcd.database.coreos.com
  resources:
  - etcdclusters
  - etcdbackups
  - etcdrestores
  verbs:
  - '*'
- apiGroups:
  - ""
  resources:
  - pods
  - services
  - endpoints
  - persistentvolumeclaims
  - events
  verbs:
  - '*'
- apiGroups:
  - apps
  resources:
  - deployments
  verbs:
  - '*'
- apiGroups:
  - ""
  resources:
  - secrets
  verbs:
  - get
```

这个Role资源会在对应的命名空间中创建出来

```
$ kubectl create -f etcd-operator-role.yaml
role.rbac.authorization.k8s.io/etcd-operator-role created
```



#### role binding

绑定角色到ServiceAccount

```sh
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: etcd-operator-rolebinding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: etcd-operator-role
subjects:
- kind: ServiceAccount
  name: etcd-operator-sa
  namespace: default
```



```sh
$  kubectl create -f etcd-operator-rolebinding.yaml
rolebinding.rbac.authorization.k8s.io/etcd-operator-rolebinding created
```





### Deploying etcd Operator

The Operator is a custom controller running in a pod, and it watches the EtcdCluster CR you defined earlier



```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: etcd-operator
spec:
  selector:
    matchLabels:
      app: etcd-operator
  replicas: 1
  template:
    metadata:
      labels:
        app: etcd-operator
```





```
$ kubectl create -f etcd-operator-deployment.yaml
deployment.apps/etcd-operator created
```

```
$ kubectl get rs
$ kubectl get deploy
```





```
$ kubectl describe deploy/etcd-operator
Name:                   etcd-operator
Namespace:              default
CreationTimestamp:      Fri, 04 Dec 2020 16:13:32 +0800
Labels:                 <none>
Annotations:            deployment.kubernetes.io/revision: 1
Selector:               app=etcd-operator
Replicas:               1 desired | 1 updated | 1 total | 0 available | 1 unavailable
StrategyType:           RollingUpdate

[...]

Events:
  Type    Reason             Age   From                   Message
  ----    ------             ----  ----                   -------
  Normal  ScalingReplicaSet  36s   deployment-controller  Scaled up replica set etcd-operator-d455d6d75 to 1
```



#### 声明一个EtcdCluster

之前创建了一个叫EtcdCluster的CRD, 现在就有了一个operator监控这个EtcdCluster资源，比如可以定义资源在集群中的期望状态。

两个sepc元素：

- size - the number of etcd cluster members
- version - etcd each of those members should run



```
$ kubectl create -f etcd-cluster-cr.yaml
etcdcluster.etcd.database.coreos.com/example-etcd-cluster created
```



修改EtcdCluster数量, 在资源EtcdCluster中修改：

```
apiVersion: etcd.database.coreos.com/v1beta2
kind: EtcdCluster
metadata:
  name: example-etcd-cluster
spec:
  size: 1 # 修改数量
  version: 3.1.10
```



可以通过动态看到实例伸缩情况：

```
$ kubectl get pods -w
```

```
example-etcd-cluster-q5pjpw46bd   1/1     Running   0          6m
example-etcd-cluster-d7jb745rz8   1/1     Terminating   0          7m48s
example-etcd-cluster-d7jb745rz8   0/1     Terminating   0          7m49s
example-etcd-cluster-d7jb745rz8   0/1     Terminating   0          7m58s
example-etcd-cluster-d7jb745rz8   0/1     Terminating   0          7m58s
```



```
$ kubectl get svc
example-etcd-cluster          ClusterIP   None            <none>        2379/TCP,2380/TCP   14m
example-etcd-cluster-client   ClusterIP   10.101.52.169   <none>        2379/TCP            14m
```





```
kubectl delete -f etcd-operator-sa.yaml
kubectl delete -f etcd-operator-role.yaml
kubectl delete -f etcd-operator-rolebinding.yaml
kubectl delete -f etcd-operator-crd.yaml
kubectl delete -f etcd-operator-deployment.yaml
kubectl delete -f etcd-cluster-cr.yaml
```



## operators and kubernetes interface

为什么operator对于k8s原生应用来说有重要意义？



An Operator is the application-specific combination of CRs and a custom controller that does know all the details about starting, scaling, recovering, and managing its application

