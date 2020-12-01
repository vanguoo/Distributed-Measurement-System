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

