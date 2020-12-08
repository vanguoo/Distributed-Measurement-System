# 缘起
kubernetes中我们使用的 Deployment， DamenSet，StatefulSet, Service，Ingress, ConfigMap, Secret 这些都是资源，而对这些资源的创建、更新、删除的动作都会被成为为事件(Event)，Kubernetes 的 Controller Manager 负责事件监听，并触发相应的动作来满足期望（Spec），这种方式也就是声明式，即用户只需要关心应用程序的最终状态

CRD则是用户自定义的k8s资源，CRD文件主要包括apiVersion、Kind、metadata和spec，apiVersion表示资源所属的组织和版本。

扩展CRD有很多开发工具，如operator-sdk和kubebuilder，不需要自己重新定义资源，监听这些资源的add、update时间，一键生成operator需要的内容，只需要关心如何实现自己的reconcile loop



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

上一部分介绍了手动运行operator，包括

- 创建deployment
- 添加CRD
- 以及配置必要的权限

OLM为生产环境中的operator启用更强大的部署模型。

OLM提供一种陈述是的方式来安装、管理和升级Operator，以及在集群中所依赖的资源。对其管理的组件强制执行一些约束。

OLM 可帮助您在 Kubernetes 集群中安装、更新所有 Operator（及其相关服务）并对其整个生命周期实施一般性管理。



## 架构

OLM由两个Operator组成，OLM Operator and Catalog Operator



架构：

| Resource              | Short Name | Owner   | Description                                    |
| --------------------- | ---------- | ------- | :--------------------------------------------- |
| ClusterServiceVersion | csv        | OLM     | 应用程序元数据：名称、版本、图标、资源、安装等 |
| InstallPlan           | ip         | Catalog | 为自动安装或升级CSV而需创建的计算列表          |
| CatalogSource         | catsrc     | Catalog | 一个软件包存储库                               |
| Subscription          | sub        | Catalog | 跟踪*频道*来保持CSV更新                        |
| OperatorGroup         | og         | OLM     | 用于对多个命名空间进行分组                     |



每个Operator创建的资源：

| Operator | Creatable Resources        |
| -------- | -------------------------- |
| OLM      | Deployment                 |
| OLM      | Service Account            |
| OLM      | (Cluster)Roles             |
| OLM      | (Cluster)RoleBindings      |
| Catalog  | Custom Resource Definition |
| Catalog  | ClusterServiceVersion      |

![](https://tva1.sinaimg.cn/large/0081Kckwly1glgi2fncn9j30jg0bwjsb.jpg)

### Catalog Operator

- 负责解析和安装**CSV**及其指定的所需资源。

- 监视频道中的CatalogSource中是否有软件包更新，将其升级。实现参考文档：*[Catalog Polling](https://github.com/operator-framework/operator-lifecycle-manager/blob/master/doc/design/catalog-polling.md)*

- 跟踪频道中软件包的用户可创建**Subscription**资源，此资源配置所需软件包、频道和CatalogSource。找到更新后，代表用户将适当**InstallPlan**写入命名空间。
- 用户可以直接创建InstallPlan，包含所需CSV和批准策略的名称，Catalog Operator 会为创建所有所需资源创建一个执行计划。批准后，Catalog Operator 将在 InstallPlan 中创建所有资源；然后单独满足 OLM Operator 的要求，从而继续安装 CSV。

#### 工作流：

- 拥有 CRD 和 CSV 缓存，按名称索引。
- 监视是否有用户创建的未解析 InstallPlan：
  - 查找与请求名称相匹配的 CSV，并将其添加为已解析的资源。
  - 对于每个受管或所需 CRD，将其添加为已解析的资源。
  - 对于每个所需 CRD，找到管理相应 CRD 的 CSV。
- 监视是否有已解析的 InstallPlan 并为其创建已发现的所有资源（用户批准或自动）。
- 监视 CatalogSource 和 Subscription，并根据它们创建 InstallPlan。



### Catalog Registry

Catalog Registry 存储 CSV 和 CRD 以便在集群中创建，并存储有关软件包和频道的元数据。

*package manifest* 是 Catalog Registry 中的一个条目，用于将软件包标识与 CSV 集相关联。在软件包中，频道指向特定 CSV。因为 CSV 明确引用了所替换的 CSV，软件包清单向 Catalog Operator 提供了将 CSV 更新至频道中最新版本所需的信息，逐步安装和替换每个中间版本。



### OLM Operator

1. 集群中存在CSV中指定需要的资源后，OLM Operator 将负责部署由CSV资源定义的应用程序。

2. OLM Operator不负责创建所需要的资源。用户可选择使用CLI手动创建这些资源，也可以使用Catalog来创建资源。

   用户可以为CatalogOperator定义InstallPlan，使得Catalog Operator 实现InstallPlan

> This separation of concerns enables users incremental buy-in of the OLM framework components. Users can choose to manually create these resources, or define an InstallPlan for the Catalog Operator or allow the Catalog Operator to develop and implement the InstallPlan. An operator creator does not need to learn about the full operator package system before seeing a working operator.

3. 虽然OLM Operator通常被配置为监视所有命名空间, 但是也可与其他OLM Operator使其使用，只要管理的命名空间不同即可。

#### 工作流：

监视命名空间中的ClusterServiceVersion，并检查是否满足要求，如果满足，则运行 CSV 的安装策略。

**此CSV必须为OperatorGroup的活跃成员才可运行该安装策略。**



### ClusterServiceVersion Control Loop

```
           +------------------------------------------------------+
           |                                                      |
           |                                      +--> Succeeded -+
           v                                      |               |
None --> Pending --> InstallReady --> Installing -|               |
           ^                                       +--> Failed <--+
           |                                              |
           +----------------------------------------------+
\                                                                 /
 +---------------------------------------------------------------+
    |
    v
Replacing --> Deleting
```












## OLM工作流
![](https://tva1.sinaimg.cn/large/0081Kckwly1gl8gut389bj30v808twfq.jpg)


## OLM中的operator安装和升级工作流
用以下资源(Custom Resource)解决operator的安装和升级问题
- ClusterServiceVersion(CSV)
- CatalogSource
- Subscrption

概述：

*CSV*是定义了operator元数据的列表，可以用来描述operator以及operator的依赖。

拥有CSV的多个operator被列在*catalog*中，

Users then *subscribe* to an Operator from the catalog to tell OLM to provision and manage a desired Operator

同时，operator又管理集群中的应用或服务





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

```sh
$ kubectl explain packagemanifest
KIND:     PackageManifest
VERSION:  packages.operators.coreos.com/v1

DESCRIPTION:
     PackageManifest holds information about a package, which is a reference to
     one (or more) channels under a single package.
```





## 实例：安装etcd-Operator

定义一个operatorGroup，为 OLM 安装的 Operator 提供多租户配置。

### OperatorGroup

[redhat doc](https://access.redhat.com/documentation/zh-cn/openshift_container_platform/4.2/html/operators/olm-understanding-operatorgroups)

[github doc](https://github.com/operator-framework/operator-lifecycle-manager/blob/master/doc/design/operatorgroups.md)

关于operatorGroup： OperatorGroup 选择**一组目标命名空间**，在其中为其成员 Operator 生成所需的 RBAC 访问权限。

> define an OperatorGroup to dictate which namespaces the Operator will manage.



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

```
$ kubectl apply -f all-og.yaml
operatorgroup.operators.coreos.com/default-og created

$ kubectl get operatorgroups
NAME         AGE
default-og   11h
```



### Subscription



**subscription** 能够触发安装operator流程，在这之前，需要决定哪个channel需要subscribe 



olm 提供了 channel information ：
(类似安装包信息)

```
$ kubectl describe packagemanifest/etcd -n olm
Name:         etcd
Namespace:    olm
Labels:       catalog=operatorhubio-catalog
              catalog-namespace=olm
              operatorframework.io/arch.amd64=supported
              operatorframework.io/os.linux=supported
              provider=CNCF
              provider-url=
Annotations:  <none>
API Version:  packages.operators.coreos.com/v1
Kind:         PackageManifest
Metadata:
  Creation Timestamp:  2020-12-07T08:16:12Z
  Self Link:           /apis/packages.operators.coreos.com/v1/namespaces/olm/packagemanifests/etcd
Spec:
Status:
  Catalog Source:               operatorhubio-catalog
      Provider:
        Name:  CNCF
      Related Images:
        quay.io/coreos/etcd-operator@sha256:66a37fd61a06a43969854ee6d3e21087a98b93838e284a6086b13917f96b0d9b
      Version:    0.9.4-clusterwide
    Name:         clusterwide-alpha
    Current CSV:  etcdoperator.v0.9.4
    Current CSV Desc:
      Annotations:
        Alm - Examples:  [   # [1]
 # [2]
]

    
      Install Modes: # [3]
        Supported:  true
        Type:       OwnNamespace
        Supported:  true    #[4]
        Type:       SingleNamespace
        Supported:  false
        Type:       MultiNamespace
        Supported:  false
        Type:       AllNamespaces
      Keywords:
        etcd
        key value
        database
        coreos
      Provider:
        Name:  CNCF
      Related Images:
        quay.io/coreos/etcd-operator@sha256:66a37fd61a06a43969854ee6d3e21087a98b93838e284a6086b13917f96b0d9b
      Version:      0.9.4
    Name:           singlenamespace-alpha
  Default Channel:  singlenamespace-alpha [5]
  Package Name:     etcd
  Provider:
    Name:  CNCF
Events:    <none>
```



[1] 

[2] 

[3] 安装模式

[4] 这个频道提供了operator，可以监控一种命名空间

[5]选择的channel





在确定了channel之后，最后一步是创建一个subscription resource 

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

1. 在默认命名空间安装
2. 表示要安装的operator名称，可以由packagemanifest API 查找
3. source and sourceNamespace 描述在catalogsource 中
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



