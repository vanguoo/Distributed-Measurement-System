[文档参考](https://access.redhat.com/documentation/zh-cn/openshift_container_platform/4.2/html/operators/olm-what-operators-are#olm-why-use-operators_olm-what-operators-are)

# 缘起
kubernetes中我们使用的 Deployment， DamenSet，StatefulSet, Service，Ingress, ConfigMap, Secret 这些都是资源，而对这些资源的创建、更新、删除的动作都会被成为为事件(Event)，Kubernetes 的 Controller Manager 负责事件监听，并触发相应的动作来满足期望（Spec），这种方式也就是声明式，即用户只需要关心应用程序的最终状态

CRD文件主要包括apiVersion、Kind、metadata和spec，apiVersion表示资源所属的组织和版本。

扩展CRD有很多开发工具，如operator-sdk和kubebuilder，不需要自己重新定义资源，监听这些资源的add、update时间，一键生成operator需要的内容，只需要关心如何实现自己的reconcile loop


## operator是什么
operator 是一种 kubernetes 的扩展形式，利用自定义资源对象（Custom Resource）来管理应用和组件，允许用户以 Kubernetes 的声明式 API 风格来管理应用及服务。

> an opearator is a kubernetes pattern that is extending the kubernetes control plane with a custom controller and custom resource definitions that add additional operational knowledge of an application

# operator-sdk框架

[operator-framework](https://github.com/operator-framework/operator-lifecycle-manager)用来自动化、可扩展的方式管理k8s原生应用程序，即operator。operator通过k8s可扩展性来实现云服务的自动化优势，同时**提高在异构基础设施上的兼容性**




# 实践

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
这个过程会调用


## 4. 实现controller

- 控制器监控CR

- 控制器配置

- 调谐循环(Reconcile Loop)

- RBAC 取得API Server授权

## 5. 运行operator


## 6. 配置测试环境

- 以deployment运行在cluster中。


# 使用OLM部署operator






# operator lifecycle manager
如何高效管理在kubernetes集群上的第一类扩展API
提供一种陈述是的方式来安装、管理和升级Operator，以及在集群中所依赖的资源。对其管理的组件强制执行一些约束。

- 将应用程序定义为封装了需求和元数据的kubernetes资源。


### 定义的CR
- ClusterServiceVersion - csv
OLM 管理的 operator 的基本信息等，包括版本信息、其管理的 CRD、必须安装的 CRD 、依赖、安装方式等
- InstallPlan - ip
计算要创建的资源列表，以便自动安装或升级CSV
- CatalogSource - catsrc
定义应用程序的CSV，CRD和 package 的存储库。
- Subscription  - 

