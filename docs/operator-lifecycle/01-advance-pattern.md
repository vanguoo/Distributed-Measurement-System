## Controller
以资源为中心的声明式API，
声明式的方法不会告诉k8s如何做，只会设置一个k8s应该监听的期望状态，

内建控制器：
- replicaSet
- Daeamon set
- Deployment
- ...

![](https://tva1.sinaimg.cn/large/0081Kckwly1gl85gbk5kdj30ci04ygm9.jpg)

控制器是k8s控制平面的一部分，
更加复杂的应用生命周期管理

更加复杂的控制器-operator， 

对激活的调谐组件分为两类：
- 控制器，一个简单的调谐标准k8s资源的进程
- operator，一个基于CRD的复杂调谐进程，包装更加复杂的应用，并管理其生命周期


## 2. 生成清单(Manifests) 和 元数据 (Metadata)
其中清单有两种格式：bundle & package manifests， 默认情况下是bundle
operator-sdk 有一些子命令管理operator-framework 的清单以元数据

在项目的根目录下运行：
```
$ make bundle
...
/Users/vanguo996/go/bin/kustomize build config/manifests | operator-sdk generate bundle -q --overwrite --version 0.0.1
INFO[0000] Building annotations.yaml
INFO[0000] Writing annotations.yaml in /Users/vanguo996/kubePlayGround/operatorProjects/memcached-operator/bundle/metadata
INFO[0000] Building Dockerfile
INFO[0000] Writing bundle.Dockerfile in /Users/vanguo996/kubePlayGround/operatorProjects/memcached-operator
operator-sdk bundle validate ./bundle
INFO[0000] Found annotations file                        bundle-dir=bundle container-tool=docker
INFO[0000] Could not find optional dependencies file     bundle-dir=bundle container-tool=docker
INFO[0000] All validation tests have completed successfully
```