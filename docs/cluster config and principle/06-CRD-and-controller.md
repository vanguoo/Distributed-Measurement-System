# kubernetes API扩展
所有对象都被抽象定义为某种资源对象，系统会为其设置一个**API入口(API EndPoint)**，对资源对象的操作都需要通过Master核心组件**API Server**调用资源对象的API来完成。
而与API Server可以通过命令行工具，或访问RESTful API进行。

k8s系统内置的Pod，Service，RC，Service，ConfigMap等资源对象已经能够满足常见的容器引用管理要求，但是用户系统将其自行开发的第三方系统纳入k8s，并**使用kubernetes的API对其进行自定义的功能或配置**，就需要对API进行扩展，其中扩展有两种方式

- CRD，复用kubernetes的API Server，无需编写额外的API Server，用户只需要定义CRD，并且提供一个CRD控制器
- API聚合，用户需要编写额外的API Server


## CRD

在k8s v1.7之后，允许用户在 Kubernetes 中添加一个跟 Pod、Node 类似的、新的 API 资源类型，即：自定义 API 资源 - Custom Resource Definition

在一个运行中的集群中，**自定义资源**可以动态注册到集群中。注册完毕以后，用户可以通过kubelet创建和访问这个自定义的对象，类似于操作pod一样。

### declarative API：
CRD本身只是一段声明，用于定义用户自定义的资源对象。但是仅有CRD 的定义并没有实际作用，**用户还需要提供管理CRD对象的CRD控制器**，才能实现对CRD对象的管理。

控制器可以把资源更新成用户想要的状态，并且通过一系列操作维护和变更状态。定制化控制器是用户可以在运行中的集群内部署和更新的一个控制器，**它独立于集群本身的生命周期**。 定制化控制器可以和任何一种资源一起工作，当和定制化资源结合使用时尤其有效。

### CRD控制器
控制器通常用go语言开发，并遵循Kubernetes的控制器开发规范


### CRD使用场景
使用restful风格API开发，开发容器容器保存镜像或者重启镜像操作。通过task触发逻辑，可以在原生k8s增加一个CRD，



## 实例

```
apiVersion: samplecrd.k8s.io/v1
kind: Network
metadata:
  name: example-network
spec:
  cidr: "192.168.0.0/16"
  gateway: "192.168.0.1"
```

想要描述"网络"的API资源类型是Network，API 组是samplecrd.k8s.io；API 版本是 v1

为了能够让 Kubernetes 认识这个 CR，你就需要让 Kubernetes 明白这个 CR 的宏观定义是什么，也就是 CRD（Custom Resource Definition）。


#### CRD文件：
```
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  name: networks.samplecrd.k8s.io
spec:
  group: samplecrd.k8s.io
  version: v1
  names:
    kind: Network
    plural: networks
  scope: Namespaced
```


- metdata：name中的格式为：plural . groupl，此时这里的plural是network
- group：设置API所属的组，将其映射为API url 中 apis/ 的下一级目录：pkg/apis/samplecrd/k8s/io
- scope：该API生效范围，可以设置为：Namespaced（定义的Network是一个属于Namespace的对象）和Cluster（在集群范围内生效，不局限与任何Namesapce）默认值为Namespaced
- versions：设置CRD支持的版本

**它是Network API 资源类型的 API 部分的宏观定义**

使用命令创建CRD对象，
```
$ kubectl create -f demoCRD.yaml
customresourcedefinition.apiextensions.k8s.io/networks.samplecrd.k8s.io created

$ kubectl  get CustomResourceDefinition
NAME                        CREATED AT
networks.samplecrd.k8s.io   2020-11-27T07:37:00Z
```

定义了两部分：
自定义资源类型的API描述，包括：组(Group)、版本(Version)、资源(Resource)

自定义资源类型的对象描述，Spec, Status

## 自定义控制器工作原理

![](images/32e545dcd4664a3f36e95af83b571ec3.png)

- 控制器从k8s的API Server中取出对象，在这里就是Network对象。这个操作是依赖于Informer(通知器)的代码库完成。

```
networkClient, err := clientset.NewForConfig(cfg)  // clientset 来自code generator
networkInformerFactory := informers.NewSharedInformerFactory(networkClient, time.Second*30)
```
- Network Informer 正是使用这个 networkClient，跟 APIServer 建立了连接。不过，真正负责维护这个连接的，则是 Informer 所使用的 **Reflector 包**。

Reflector 使用的是一种叫作 ListAndWatch 的方法，来“获取”并“监听”这些 Network 对象实例的变化。

...其中工作原理略过


##### 总结
kubernetes API 编程范式的具体原理，
这些自动生成的代码，就为我们提供了一个可靠而高效地获取API对象“期望状态”的编程库。
作为开发者就只需要关注如何拿到“实际状态”，然后和“期望状态”做对比。


已经了解到：
- k8s内置编排对象
- 对应控制器模式的实现原理
- 自定义API资源类型和控制器的编写方式


接下来：
很多容器化工作，都会要求设计一个自己的编排对象，实现自己的控制器模式。
这可以通过**插件机制**，不需要修改任何一行代码。


