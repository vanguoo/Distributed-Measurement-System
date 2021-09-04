# 缘起
kubernetes中我们使用的 Deployment， DamenSet，StatefulSet, Service，Ingress, ConfigMap, Secret 这些都是资源，而对这些资源的创建、更新、删除的动作都会被成为为事件(Event)，Kubernetes 的 Controller Manager 负责事件监听，并触发相应的动作来满足期望（Spec），这种方式也就是声明式，即用户只需要关心应用程序的最终状态

CRD则是用户自定义的k8s资源，CRD文件主要包括apiVersion、Kind、metadata和spec，apiVersion表示资源所属的组织和版本。

扩展CRD有很多开发工具，如operator-sdk和kubebuilder，不需要自己重新定义资源，监听这些资源的add、update时间，一键生成operator需要的内容，只需要关心如何实现自己的reconcile loop









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







# Operator-sdk框架

### operator

operator 是一种 kubernetes 的扩展形式，利用自定义资源对象（Custom Resource）通过自定义控制器来管理应用和组件，允许用户以 Kubernetes 的声明式 API 风格来管理应用及服务。

> an opearator is a kubernetes pattern that is extending the kubernetes control plane with a custom controller and custom resource definitions that add additional operational knowledge of an application

operator = CRD + Custom controller + additional operational knowleage

[operator-framework](https://github.com/operator-framework/operator-lifecycle-manager)用来自动化、可扩展的方式管理k8s原生应用程序，即operator。operator通过k8s可扩展性来实现云服务的自动化优势，同时**提高在异构基础设施上的兼容性**

- 高级API和抽象，用于更直观地编写操作逻辑



# 实践

### 1. 安装operator-sdk：

```
export RELEASE_VERSION=v1.1.0

curl -LO https://github.com/operator-framework/operator-sdk/releases/download/${RELEASE_VERSION}/operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu

chmod +x operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu && sudo mkdir -p /usr/local/bin/ && sudo cp operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu /usr/local/bin/operator-sdk && rm operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu
```

### 2. 创建项目

在这之前需要:

```
export GO111MODULE=on
```

```
mkdir -p $HOME/projects/memcached-operator
cd $HOME/projects/memcached-operator
operator-sdk init --domain=example.com --repo=github.com/example-inc/memcached-operator
```
这一步会生成一个go.mod文件， --repo 表示在 **$GOPATH/src** 外创建一个项目。

整个项目结构：
```
$ tree -L 2
.
├── Dockerfile
├── Makefile
├── PROJECT
├── bin
│   └── manager
├── config
│   ├── certmanager
│   ├── default
│   ├── manager
│   ├── prometheus
│   ├── rbac
│   ├── scorecard
│   └── webhook
├── go.mod
├── go.sum
├── hack
│   └── boilerplate.go.txt
└── main.go
```

### 3.创建CRD

```
operator-sdk create api --group=cache --version=v1alpha1 --kind=Memcached
Create Resource [y/n]
y
Create Controller [y/n]
y
Writing scaffold for you to edit...
api/v1alpha1/memcached_types.go
controllers/memcached_controller.go
```

可以看到创建出了自定义API和控制器的框架：

```
api/v1alpha1/memcached_types.go
controllers/memcached_controller.go
```

在目录中多出了：
```
├── api
│   └── v1alpha1
├── controllers
│   ├── memcached_controller.go
│   └── suite_test.go
```

在 *types.go中添加：

```
// MemcachedSpec defines the desired state of Memcached
type MemcachedSpec struct {
	// +kubebuilder:validation:Minimum=0
	// Size is the size of the memcached deployment
	Size int32 `json:"size"`
}

// MemcachedStatus defines the observed state of Memcached
type MemcachedStatus struct {
	// Nodes are the names of the memcached pods
	Nodes []string `json:"nodes"`
}
```

在项目目录中运行：
```
make generate
```

### 4. 实现controller

- 控制器监控CR

- 控制器配置

- 调谐循环(Reconcile Loop)

- RBAC 取得API Server授权

### 5. 运行operator

...

### 6. 配置测试环境

- 以deployment形式运行在cluster中。





# Operator Lifecycle Manager

[参考文档-redhat](https://access.redhat.com/documentation/zh-cn/openshift_container_platform/4.2/html/operators/understanding-the-operator-lifecycle-manager-olm)

[参考文档-operator-sdk](https://sdk.operatorframework.io/docs/olm-integration/quickstart-package-manifests/)

[参考文档-olm](https://olm.operatorframework.io/docs/getting-started/)

上一部分介绍了手动运行operator，下面介绍如何使用OLM为生产环境中的operator启用更强大的部署模型。

OLM提供一种陈述是的方式来安装、管理和升级Operator，以及在集群中所依赖的资源。对其管理的组件强制执行一些约束。

OLM 可帮助您在 Kubernetes 集群中安装、更新所有 Operator（及其相关服务）并对其整个生命周期实施一般性管理。




## OLM工作流
![](https://tva1.sinaimg.cn/large/0081Kckwly1gl8gut389bj30v808twfq.jpg)


## OLM中的operator安装和升级工作流
用以下资源(Custom Resource)解决operator的安装和升级问题
- ClusterServiceVersion(CSV)
- CatalogSource
- Subscrption

### 1. ClusterServiceVersion
CSV类似于linux安装包，比如rpm，其中就包括了如何安装operator以及相关依赖。
CSV:

- 一个定义了operator所有性质的清单，
- operator容器镜像附带的元数据，

config/manifests/bases/*.yaml 包含以下内容：

包含以下内容：
- 元数据
名称、描述、版本、链接、标签、图标...

- 安装策略
类型：Deployment

- CRD
CSV 中定义的 Operator 元数据可保存在一个名为 CatalogSource 的集合中，CatalogSource 使用 Operator Registry API，OLM 又使用 CatalogSource **来查询是否有可用的 Operator 及已安装 Operator 是否有升级版本**。



### 2. Catalogsouce (Community Operators)
访问operator的仓库。其中operator被整合成更新流(Stream)，这称为**channel**，这是一个软件在持续发行周期中常见的更新模式

![](https://tva1.sinaimg.cn/large/0081Kckwly1gl98hwulpgj30j805yjru.jpg)

### 3. Subscription
用户在subscription中的特定catalog指定软件包或频道。
类比linux中的包安装命令，比如yum install，

catalog中的软件包和频道：
![](https://tva1.sinaimg.cn/large/0081Kckwly1gl99eus1yhj30ox0d73zm.jpg)

避免特定版本。避免最近版本。

OLM 会刻意避免版本比较，因此给定 catalog → channel → package 路径提供的“latest”或“newest”Operator 不一定是最高版本号。

subscription为频道的 head 引用，类似 Git 存储库。





### 4. operatorGroup
operatorgroup是一个olm资源，为olm安装的operator提供**多租户配置**，operatorGroup选择一组命名空间，在其中operator成员生成RBAC访问权限。




*approval mode*，manual or automatic






# 实践

## OLM安装

生产环境下：

```
curl -L https://github.com/operator-framework/operator-lifecycle-manager/releases/download/v0.17.0/install.sh -o install.sh
chmod +x install.sh
./install.sh v0.17.0 
```
或：
```
git clone https://gitee.com/vanguo996/operator-lifecycle-manager.git
cd operator-lifecycle-manager
kubectl create -f deploy/upstream/quickstart/crds.yaml
kubectl create -f deploy/upstream/quickstart/olm.yaml
```


在minikube环境下：
```
git clone https://github.com/operator-framework/operator-lifecycle-manager.git
cd operator-lifecycle-manager
make run-local
```

验证安装：
```
$ kubectl get deploy -n olm
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
catalog-operator   1/1     1            1           68s
olm-operator       1/1     1            1           68s
packageserver      1/1     1            1           57s
```
> 注意：如果出现没有packageserver，意味着什么？





 获取自定义资源：

```
$ kubectl get crd
NAME                                          CREATED AT
catalogsources.operators.coreos.com           2020-12-01T09:10:59Z
clusterserviceversions.operators.coreos.com   2020-12-01T09:11:00Z
installplans.operators.coreos.com             2020-12-01T09:11:01Z
operatorgroups.operators.coreos.com           2020-12-01T09:11:03Z
operators.operators.coreos.com                2020-12-01T09:11:03Z
subscriptions.operators.coreos.com            2020-12-01T09:11:04Z
```


在安装olm的时候在olm namespace 中默认创建了catalog source：

```
$ kubectl get catalogsources -n olm
NAME                    DISPLAY               TYPE   PUBLISHER        AGE
operatorhubio-catalog   Community Operators   grpc   OperatorHub.io   11h
```



catalogsource 可以读取operatorhub.io上的operator，使用packagemanifest api获取

```
$ kubectl get packagemanifest -n olm
NAME                                       CATALOG               AGE
shipwright-operator                        Community Operators   11h
eunomia                                    Community Operators   11h
hedvig-operator                            Community Operators   11h
tidb-operator                              Community Operators   11h
flux                                       Community Operators   11h
kubemod                                    Community Operators   11h
```

> 注意：如果没有出现operator安装包，意味着什么?

解释：

```sh
$ kubectl explain packagemanifest
KIND:     PackageManifest
VERSION:  packages.operators.coreos.com/v1

DESCRIPTION:
     PackageManifest holds information about a package, which is a reference to
     one (or more) channels under a single package.
```





## 实例：安装etcd-Operator


- 定义一个operatorgroup，指定operator将要控制的namespace，

```
apiVersion: operators.coreos.com/v1alpha2
kind: OperatorGroup
metadata:
  name: default-og
  namespace: default
spec:
  targetNamespaces:
  - default
```

> which channel you want to subscribe to?



olm 提供了 channel information ：
(类似安装包信息)

```
kubectl describe packagemanifest/etcd -n olm
Name:         etcd
Namespace:    olm
Labels:       catalog=operatorhubio-catalog
              catalog-namespace=olm
			  [...]
```



- once you decided on a channel, the last step is to create the subscription resource itself:

```
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: etcd-subscription
  namespace: default  # [1]
spec:
  name: etcd # [2]
  source: operatorhubio-catalog  #[3]
  sourceNamespace: olm
  channel: singlenamespace-alpha # [4]
```

1. this manifest install the substription and **the operator deployment itself, in the default namespace**

2. 表示要安装的operator名称，可以由packagemanifest API 查找

3. source and sourceNamespace 描述在catalogsource 中可以找到operator

4. olm会从这个channel安装operator

执行：

```
$ kubectl apply -f sub.yaml
subscription.operators.coreos.com/etcd-subscription created
```
表示创建一个subscription，**此时OLM会在默认的namespace中创建一个CSV 资源：**

```
$ kubectl get csv -n default
NAME                  DISPLAY   VERSION   REPLACES              PHASE
etcdoperator.v0.9.4   etcd      0.9.4     etcdoperator.v0.9.2   Succeeded
```

CSV实际上是一个安装包，这正是subscription所安装的东西。OLM就是一个operator的安装过程，这个过程又被定义在CSV中，用来去创建operator pods本身。

同时OLM会存储这个过程，通过这个命令可以看到：

```
$ kubectl describe csv/etcdoperator.v0.9.4

[...]
Events:
  Type     Reason              Age               From                        Message
  ----     ------              ----              ----                        -------
  Normal   NeedsReinstall      8h (x4 over 10h)  operator-lifecycle-manager  installing: waiting for deployment etcd-operator to become ready: Waiting for rollout to finish: 0 of 1 updated replicas are available...
  Warning  ComponentUnhealthy  8h                operator-lifecycle-manager  installing: waiting for deployment etcd-operator to become ready: Waiting for rollout to finish: 0 of 1 updated replicas are available...
  Normal   AllRequirementsMet  8h (x5 over 10h)  operator-lifecycle-manager  all requirements found, attempting install
  Normal   InstallSucceeded    8h (x7 over 10h)  operator-lifecycle-manager  waiting for install components to report healthy
  Normal   InstallWaiting      8h (x3 over 10h)  operator-lifecycle-manager  installing: waiting for deployment etcd-operator to become ready: Waiting for deployment spec update to be observed...
  Normal   InstallSucceeded    8h (x4 over 10h)  operator-lifecycle-manager  install strategy completed with no errors
```

OLM 根据定义在 CSV中的 deployment template 来创建operator pod，可以查看deployment对象：

```
$ kubectl get deployment

NAME            READY   UP-TO-DATE   AVAILABLE   AGE
etcd-operator   1/1     1            1           144m
```

同样，也可查看对象细节：

```
$ kubectl get deployment/etcd-operator -n default -o yaml

  name: etcd-operator
  namespace: default
  ownerReferences:
  - apiVersion: operators.coreos.com/v1alpha1
    blockOwnerDeletion: false
    controller: false
    kind: ClusterServiceVersion
    name: etcdoperator.v0.9.4
    uid: 52ca972a-dbb4-4d11-b058-d1c69c506968
```


```
$ kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
etcd-operator-7465489dbd-wmr4z   3/3     Running   5          153m
```



#### 删除operator

```
$ kubectl delete csv/etcdoperator.v0.9.4
clusterserviceversion.operators.coreos.com "etcdoperator.v0.9.4" deleted
```







#### 总结

在创建了subscription之后，发生了如下事情:
- OLM在同样的namespace中创建了CSV 资源，其中这个CSV 包括了创建operator的deployment对象的具体清单。
- OLM 用deployment 清单(Manifest) 来创建了deployment 资源， 持有者(owner) 是CSV
- 最后deployment 通过 replica set 部署pod



## 实例：argocd-operator

```
git clone https://gitee.com/vanguo996/argocd-operator.git
cd argocd-operator
```

创建命名空间：
```
kubectl create namespace argocd
```
在olm命名空间中创建一个CatalogSource，这个清单引用了一个容器镜像，这个镜像打包成operator在OLM中使用。

#### operator Catalog
```
kubectl create -n olm -f deploy/catalog_source.yaml
```

验证argocd operator catalog 已经被创建

```
$ kubectl get catalogsources -n olm
NAME                    DISPLAY               TYPE   PUBLISHER           AGE
argocd-catalog          Argo CD Operators     grpc   Argo CD Community   16h
```
服务于 catalog 的 registry pod 已经在运行：
```
$ kubectl get pods -n olm -l olm.catalogSource=argocd-catalog
NAME                   READY   STATUS    RESTARTS   AGE
argocd-catalog-llrzn   1/1     Running   1          16h
```

有关catalogsource的描述：
```
$ kubectl explain catalogsources
KIND:     CatalogSource
VERSION:  operators.coreos.com/v1alpha1

DESCRIPTION:
     CatalogSource is a repository of CSVs, CRDs, and operator packages.
```



#### operatorGroup
在argocd命名空间中创建一个operatorGroup

```
kubectl create -n argocd -f deploy/operator_group.yaml
```

```
$ kubectl get operatorgroup -n argocd
NAME              AGE
argocd-operator   16h
```

有关operatorgroup的描述：
```
$ kubectl explain operatorgroups -n olm
KIND:     OperatorGroup
VERSION:  operators.coreos.com/v1

DESCRIPTION:
     OperatorGroup is the unit of multitenancy for OLM managed operators. It
     constrains the installation of operators in its namespace to a specified
     set of target namespaces.
```


#### Subscription

在本命名空间中创建一个subsription对象，

```
kubectl create -n argocd -f deploy/subscription.yaml
```


```
$ kubectl explain sub -n olm
KIND:     Subscription
VERSION:  operators.coreos.com/v1alpha1

DESCRIPTION:
     Subscription keeps operators up to date by tracking changes to Catalogs.
```


#### InstallPlan


```
$ kubectl explain installplans
KIND:     InstallPlan
VERSION:  operators.coreos.com/v1alpha1

DESCRIPTION:
     InstallPlan defines the installation of a set of operators.
```



