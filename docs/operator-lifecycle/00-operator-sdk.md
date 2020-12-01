
# 介绍
kubernetes中我们使用的 Deployment， DamenSet，StatefulSet, Service，Ingress, ConfigMap, Secret 这些都是资源，而对这些资源的创建、更新、删除的动作都会被成为为事件(Event)，Kubernetes 的 Controller Manager 负责事件监听，并触发相应的动作来满足期望（Spec），这种方式也就是声明式，即用户只需要关心应用程序的最终状态


CRD文件主要包括apiVersion、Kind、metadata和spec，apiVersion表示资源所属的组织和版本。


## operator是什么
operator 是一种 kubernetes 的扩展形式，利用自定义资源对象（Custom Resource）来管理应用和组件，允许用户以 Kubernetes 的声明式 API 风格来管理应用及服务。

> an opearator is a kubernetes pattern that is extending the kubernetes control plane with a custom controller and custom resource definitions that add additional operational knowledge of an application

etcd opeator: 备份以及扩展etcd集群。

## operator lifecycle manager
如何高效管理在kubernetes集群上的第一类扩展API
提供一种陈述是的方式来安装、管理和升级Operator，以及在集群中所依赖的资源。对其管理的组件强制执行一些约束。

- 将应用程序定义为封装了需求和元数据的kubernetes资源。


### 定义的CR


## 实践

```
export RELEASE_VERSION=v1.1.0

curl -LO https://github.com/operator-framework/operator-sdk/releases/download/${RELEASE_VERSION}/operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu

chmod +x operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu && sudo mkdir -p /usr/local/bin/ && sudo cp operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu /usr/local/bin/operator-sdk && rm operator-sdk-${RELEASE_VERSION}-x86_64-linux-gnu
```

