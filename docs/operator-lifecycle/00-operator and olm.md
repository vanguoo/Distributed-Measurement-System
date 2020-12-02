[文档参考](https://access.redhat.com/documentation/zh-cn/openshift_container_platform/4.2/html/operators/olm-what-operators-are#olm-why-use-operators_olm-what-operators-are)

# 缘起
kubernetes中我们使用的 Deployment， DamenSet，StatefulSet, Service，Ingress, ConfigMap, Secret 这些都是资源，而对这些资源的创建、更新、删除的动作都会被成为为事件(Event)，Kubernetes 的 Controller Manager 负责事件监听，并触发相应的动作来满足期望（Spec），这种方式也就是声明式，即用户只需要关心应用程序的最终状态

CRD文件主要包括apiVersion、Kind、metadata和spec，apiVersion表示资源所属的组织和版本。

扩展CRD有很多开发工具，如operator-sdk和kubebuilder，不需要自己重新定义资源，监听这些资源的add、update时间，一键生成operator需要的内容，只需要关心如何实现自己的reconcile loop


## operator是什么
operator 是一种 kubernetes 的扩展形式，利用自定义资源对象（Custom Resource）来管理应用和组件，允许用户以 Kubernetes 的声明式 API 风格来管理应用及服务。

> an opearator is a kubernetes pattern that is extending the kubernetes control plane with a custom controller and custom resource definitions that add additional operational knowledge of an application

## operator-sdk框架

[operator-framework](https://github.com/operator-framework/operator-lifecycle-manager)用来自动化、可扩展的方式管理k8s原生应用程序，即operator。operator通过k8s可扩展性来实现云服务的自动化优势，同时**提高在异构基础设施上的兼容性**

- 高级API和抽象，用于更直观地编写操作逻辑





# 实践-使用operator-sdk安装operator

## 1. 安装operator-sdk：
```
export RELEASE_VERSION=v1.1.0

curl -LO https://github.com/operator-framework/operator-sdk/releases/download/${RELEASE_VERSION}/operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu

chmod +x operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu && sudo mkdir -p /usr/local/bin/ && sudo cp operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu /usr/local/bin/operator-sdk && rm operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu
```

## 2. 创建项目
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

## 3.创建CRD

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



## 4. 实现controller

- 控制器监控CR

- 控制器配置

- 调谐循环(Reconcile Loop)

- RBAC 取得API Server授权

## 5. 运行operator


## 6. 配置测试环境

- 以deployment运行在cluster中。





# Operator Lifecycle Manager

[参考文档-redhat](https://access.redhat.com/documentation/zh-cn/openshift_container_platform/4.2/html/operators/understanding-the-operator-lifecycle-manager-olm)
[参考文档-operator-sdk](https://sdk.operatorframework.io/docs/olm-integration/quickstart-package-manifests/)
[参考文档-olm](https://olm.operatorframework.io/docs/getting-started/)
上一部分介绍了手动运行operator，下面介绍如何使用OLM为生产环境中的operator启用更强大的部署模型。

OLM提供一种陈述是的方式来安装、管理和升级Operator，以及在集群中所依赖的资源。对其管理的组件强制执行一些约束。

- 将应用程序定义为封装了需求和元数据(Metadata)的kubernetes资源。


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

### 4. operatorgroup 



*approval mode*，manual or automatic


### 4. operatorGroup
operatorgroup是一个olm资源，为olm安装的operator提供**多租户配置**，

# 实践
先决条件:
- 基于kubernetes集群，v1.8,支持apps/v1beta2 API组
- 安装memcached operator
## 1.olm安装

1. 生产环境下：
```
export olm_release=0.15.1
kubectl apply -f https://github.com/operator-framework/operator-lifecycle-manager/releases/download/${olm_release}/crds.yaml
kubectl apply -f https://github.com/operator-framework/operator-lifecycle-manager/releases/download/${olm_release}/olm.yaml
```

2. 在minikube环境下：
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

有以下自定义资源：
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
在安装olm的时候在olm namespace 中默认创建了catalog source 
获取此资源：
```
$ kubectl get catalogsources -n olm
NAME                    DISPLAY               TYPE   PUBLISHER        AGE
operatorhubio-catalog   Community Operators   grpc   OperatorHub.io   11h
```

catalog source 可以读取operatorhub.io上的operator，
使用packagemanifest api获取

### 实例：安装etcd-Operator

定义一个operatorgroup，指定operator将要控制的namespace，
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

once you decided on a channel, the last step is to create the subscription resource itself:

```
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: etcd-subscription
  namespace: default  # [1]
spec:
  name: etcd
  source: operatorhubio-catalog
  sourceNamespace: olm
  channel: singlenamespace-alpha
```

1. this manifest install the substription and **the operator deployment itself, in the default namespace**








```
$ kubectl get csv
NAME                  DISPLAY   VERSION   REPLACES              PHASE
etcdoperator.v0.9.4   etcd      0.9.4     etcdoperator.v0.9.2   Installing
```


```
kubectl describe csv/etcdoperator.v0.9.4 -n default
[....]
  Normal  InstallWaiting       6h33m                  operator-lifecycle-manager  installing: waiting for deployment etcd-operator to become ready: Waiting for deployment spec update to be observed...
  Normal  InstallWaiting       6h33m                  operator-lifecycle-manager  installing: waiting for deployment etcd-operator to become ready: Waiting for rollout to finish: 0 of 1 updated replicas are available...

```











## 定义的CR
- ClusterServiceVersion - csv
一个利用Operator元数据创建的yaml清单，辅助OLM在集群中运行operator
OLM 管理的 operator 的基本信息等，包括版本信息、其管理的 CRD、必须安装的 CRD 、依赖、安装方式等


- InstallPlan - ip
计算要创建的资源列表，以便自动安装或升级CSV
- CatalogSource - catsrc
定义应用程序的CSV，CRD和 package 的存储库。
- Subscription  - 