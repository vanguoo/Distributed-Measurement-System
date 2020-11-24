
## Pod本质
因为容器是一种单进程模型，容器之间是平等关系没办法调度容器本身。
pod 类似于虚拟机，组合虚拟机中的进程(容器的本质就是进程)。

**pod只是一个逻辑概念**

pod知识共享了资源的一组容器， 而共享资源的方式就是

Pod 里的所有容器，共享的是同一个 Network Namespace，并且可以声明共享同一个 Volume。

pod在kubernetes项目中有一个重要意义，就是**容器设计模式**

Pod 这种“超亲密关系”容器的设计思想，实际上就是希望，当用户想在一个容器里跑多个功能并不相关的应用时，应该优先考虑它们是不是更应该被描述成一个 Pod 里的多个容器。

### 例子：war包与web容器

- war包直接放在tomcat镜像的webapps目录，做成新的镜像运行起来，

- 有了pod之后，把war包和tomcat分别做成镜像。把它们作为一个pod里面的两个容器组合在一起。

```

apiVersion: v1
kind: Pod
metadata:
  name: javaweb-2
spec:
  initContainers:
  - image: geektime/sample:v2
    name: war
    command: ["cp", "/sample.war", "/app"]
    volumeMounts:
    - mountPath: /app
      name: app-volume
  containers:
  - image: geektime/tomcat:7.0
    name: tomcat
    command: ["sh","-c","/root/apache-tomcat-7.0.42-v2/bin/start.sh"]
    volumeMounts:
    - mountPath: /root/apache-tomcat-7.0.42-v2/webapps
      name: app-volume
    ports:
    - containerPort: 8080
      hostPort: 8001 
  volumes:
  - name: app-volume
    emptyDir: {}
```

war包不是一个普通容器，而是一个init Container类型的容器，这个容器会比用户容器先启动，这样tomcat容器加载的时候，webapp目录下就存在war文件，这个文件正是 WAR 包容器启动时拷贝到这个 Volume 里面的，而这个 Volume 是被这两个容器共享的。

这样使用组合的方式，解决了war包和tomcat容器之间的耦合关系问题。这种组合叫做**sidecar**

sidecar 指的就是我们可以在一个 Pod 中，启动一个辅助容器，来完成一些独立于主进程（主容器）之外的工作。

#### 总结
"上云"工作的完成，还是要深入理解容器的本质。即，进程。

Pod，实际上是在扮演传统基础设施里“虚拟机”的角色；而容器，则是这个虚拟机里运行的用户程序。

迁移:把一个运行在虚拟机中的应用迁移到docker中，要仔细分析，到底**有哪些进程(组件)运行在这个虚拟机中**

把整个虚拟机定义为一个pod，这些进程做成容器镜像，把有顺序关系的容器定义为initContainer。

**合理、松耦合的容器编排诀窍，也是从传统应用架构，到微服务架构最自然的过度方式**


## yaml文件 & Pod API对象

Pod是k8s项目中最小编排单位，哪些属性属于Pod对象，哪些属性属于Container？ 
Pod 扮演的是传统部署环境里“虚拟机”的角色。这样的设计，是为了使用户**从传统环境（虚拟机环境）向 Kubernetes（容器环境）的迁移，更加平滑。**
Pod看成传统环境中的”机器“，容器看成运行在”机器“中的用户程序。

### Pod中重要的字段以及用法

具体见:
https://github.com/kubernetes/api/blob/master/core/v1/types.go
第2914行  podSepc

最重要的字段Container

创建
 ```
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  shareProcessNamespace: true
  containers:
  - name: nginx
    image: nginx
  - name: shell
    image: busybox
    stdin: true
    tty: true
 ```
```
kubectl create -f nginx.yaml
```

查看 & 执行
```

root@van-master:~# kubectl get pods
NAME    READY   STATUS    RESTARTS   AGE
nginx   2/2     Running   0          8m53s
root@van-master:~# kubectl attach -it nginx -c shell
If you don't see a command prompt, try pressing enter.
/ # ls
bin   dev   etc   home  proc  root  sys   tmp   usr   var
/ # ps
PID   USER     TIME  COMMAND
    1 root      0:00 /pause
    6 root      0:00 nginx: master process nginx -g daemon off;
   33 101       0:00 nginx: worker process
   34 root      0:00 sh
   41 root      0:00 ps
/ #
```

在pod中每个容器的进程对所有容器来说都是共享的，  共享了一个PID Namespace

pod中容器要共享宿主机的namespace，也是pod级别的定义。

pod最重要的字段，Container, 两个字段都属于pod对容器的定义，

Pod API 对象是整个k8s体系中最核心的概念，各种控制器也要用到的。


创建 & 删除pod对象

```
kubectl create -f pod.yaml
kubectl delete -f pod.yaml
```











