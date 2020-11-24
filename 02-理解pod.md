
## 本质
因为容器是一种单进程模型，容器之间是平等关系没办法调度容器本身。
pod 类似于虚拟机，组合虚拟机中的进程(容器的本质就是进程)。

pod在kubernetes项目中有一个重要意义，就是**容器设计模式**

**pod只是一个逻辑概念**

pod知识共享了资源的一组容器， 而共享资源的方式就是

Pod 里的所有容器，共享的是同一个 Network Namespace，并且可以声明共享同一个 Volume。



## yaml文件

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

查看pod字段:
https://github.com/kubernetes/api/blob/master/core/v1/types.go

创建 & 删除

```
kubectl create -f pod.yaml
kubectl delete -f pod.yaml
```

Deployment管理一组Pod副本，副本集，保证一定数量的副本一直可用。



