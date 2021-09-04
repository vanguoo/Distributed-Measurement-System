# 实战：

在开始之前，部署Kubernetes集群机器需要满足以下几个条件

- 一台或多台机器，操作系统为Centos7.x, ubuntu16.4
- 硬件配置：2GB或更多GAM，2个CPU或更多CPU，硬盘30G
> master强制要求需要双核: error execution phase preflight: [preflight] Some fatal errors occurred:
	[ERROR NumCPU]: the number of available CPUs 1 is less than the required 2

- 集群中所有机器之间网络互通
- 可以访问外网，需要拉取镜像
- 禁止swap分区

## 准备工作

```
# 关闭selinux
# 永久关闭
sed -i 's/enforcing/disabled/' /etc/selinux/config  
# 临时关闭
setenforce 0  

# 关闭swap
# 临时
swapoff -a 
# 永久关闭
sed -ri 's/.*swap.*/#&/' /etc/fstab
```


```
# 将桥接的IPv4流量传递到iptables的链
cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sysctl --system  
```



## 安装docker
https://www.cnblogs.com/walker-lin/p/11214127.html


## 安装kubernetes

添加源：

```
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb http://mirrors.ustc.edu.cn/kubernetes/apt kubernetes-xenial main
EOF
```
更新：

```
apt-get update
```

找不到公钥错误：

```
GPG error: http://mirrors.ustc.edu.cn/kubernetes/apt kubernetes-xenial InRelease: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 6A030B21BA07F4FB
```

添加公钥：

```
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 6A030B21BA07F4FB
```

> ref: https://zhuanlan.zhihu.com/p/46341911  &&  https://blog.csdn.net/yz1988computer/article/details/81675553



下载

```
apt-get update
apt-get install -y kubelet kubeadm kubectl
```



### 部署集群
使用 yaml文件部署


```
apiVersion: kubeadm.k8s.io/v1beta2
kind: ClusterConfiguration
kubernetesVersion: stable-1.18
imageRepository: "registry.aliyuncs.com/google_containers"
networking:
    podSubnet: "192.168.0.0/16"
```

>注意：kubeadm 的安装过程不涉及网络插件CNI的初始化，因此任何Pod包括自带CoreDNS都无法正常工作，而网络插件对kubead init 命令参数有一定的要求，
>
>--pod-network-cidr-192.168.0.0/16
>
>

执行命令部署

```
kubeadm init --config=kubeadm.yaml
```



```
W1123 20:29:16.142145   30049 configset.go:202] WARNING: kubeadm cannot validate component configs for API groups [kubelet.config.k8s.io kubeproxy.config.k8s.io]
[init] Using Kubernetes version: v1.18.12
[preflight] Running pre-flight checks
	[WARNING IsDockerSystemdCheck]: detected "cgroupfs" as the Docker cgroup driver. The recommended driver is "systemd". Please follow the guide at https://kubernetes.io/docs/setup/cri/
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Starting the kubelet
[certs] Using certificateDir folder "/etc/kubernetes/pki"
[certs] Generating "ca" certificate and key
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [van-master kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local] and IPs [10.96.0.1 192.168.0.101]
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Generating "front-proxy-ca" certificate and key
[certs] Generating "front-proxy-client" certificate and key
[...]
[addons] Applied essential addon: CoreDNS
[addons] Applied essential addon: kube-proxy

Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.0.101:6443 --token y28ukv.di3fwf6maxm5zxi0 \
    --discovery-token-ca-cert-hash sha256:889d580725ffe3a1500b0db7f420038e96004e2daa928b9663137ed9b6e62e22

```


使用kubectl工具 【master节点操作】
```
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

添加这些命令的原因是，
Kubernetes 集群默认需要加密方式访问。所以，这几条命令，就是将刚刚部署生成的 Kubernetes 集群的安全配置文件，保存到当前用户的.kube 目录下，kubectl 默认会使用这个目录下的授权信息访问 Kubernetes 集群。




#### 加入node节点

添加节点：在node上操作

```
kubeadm join 192.168.0.101:6443 --token y28ukv.di3fwf6maxm5zxi0 \
    --discovery-token-ca-cert-hash sha256:889d580725ffe3a1500b0db7f420038e96004e2daa928b9663137ed9b6e62e22a
```



使用token加入 集群，但是token是24小时制
有关token操作 ：https://kubernetes.io/zh/docs/reference/setup-tools/kubeadm/kubeadm-token/

```
root@k8s-master:/etc/kubernetes/manifests# kubeadm token list
TOKEN                     TTL         EXPIRES                     USAGES                   DESCRIPTION                                                EXTRA GROUPS
bd2i8l.nqg2pzbgucebx5k4   21h         2020-11-23T17:08:54+08:00   authentication,signing   The default bootstrap token generated by 'kubeadm init'.   system:bootstrappers:kubeadm:default-node-token

```

如果没有sha256的值，可以执行：

```root@k8s-master:/etc/kubernetes/manifests# openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | \
>    openssl dgst -sha256 -hex | sed 's/^.* //'
8e91db11a11dcaf48a04aca39a8654d6989a9357f2327aa5e6d54d818d30277a

```

token过期以后：执行

```
kubeadm token create --print-join-command
```

工作节点加入：

```
root@k8s-node1:/home/van# kubeadm join 192.168.1.112:6443 --token bd2i8l.nqg2pzbgucebx5k4 \
>     --discovery-token-ca-cert-hash sha256:8e91db11a11dcaf48a04aca39a8654d6989a9357f2327aa5e6d54d818d30277a
W1122 21:07:39.858251  110188 join.go:346] [preflight] WARNING: JoinControlPane.controlPlane settings will be ignored when control-plane flag is not set.
[preflight] Running pre-flight checks
	[WARNING IsDockerSystemdCheck]: detected "cgroupfs" as the Docker cgroup driver. The recommended driver is "systemd". Please follow the guide at https://kubernetes.io/docs/setup/cri/
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -oyaml'
[kubelet-start] Downloading configuration for the kubelet from the "kubelet-config-1.18" ConfigMap in the kube-system namespace
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.

```
加入成功




#### 部署容器网络接口，CNI网络插件 - flannel

```
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

或者:
```
wget https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
kubectl apply -f  kube-flannel.yml
```


> 注意：每个集群只能安装一个 Pod 网络。因为科学上网的问题，需要执行以下步骤：

```
# 在https://www.ipaddress.com/查询raw.githubusercontent.com的真实IP。
sudo vim /etc/hosts
199.232.28.133 raw.githubusercontent.com

```
> 注意：有多个网卡,需要在kube-flannel.yaml 中加入:

```
args:
- --ip-masq
- --kube-subnet-mgr
- --iface=<网卡名称>
```





### 状态异常重置n次


发现其中两个pods状态是container creating， 查看日志：

```
root@van-master:~# kubectl get pods -n kube-system
NAME                                 READY   STATUS              RESTARTS   AGE
coredns-7ff77c879f-bk6j8             0/1     ContainerCreating   0          81m
coredns-7ff77c879f-j9khn             0/1     ContainerCreating   0          81m

root@van-master:~# kubectl logs coredns-7ff77c879f-bk6j8 -n kube-system
Error from server (BadRequest): container "coredns" in pod "coredns-7ff77c879f-bk6j8" is waiting to start: ContainerCreating

```

状态异常：

```

root@van-master:~# kubectl get pods -n kube-system
NAME                                 READY   STATUS             RESTARTS   AGE
coredns-7ff77c879f-q7dtt             0/1     CrashLoopBackOff   1          18m
```


查看日志：

```
root@van-master:~# kubectl logs -f coredns-7ff77c879f-q7dtt -n kube-system
.:53
[INFO] plugin/reload: Running configuration MD5 = 4e235fcc3696966e76816bcd9034ebc7
CoreDNS-1.6.7
linux/amd64, go1.13.6, da7f65b
[FATAL] plugin/loop: Loop (127.0.0.1:53742 -> :53) detected for zone ".", see https://coredns.io/plugins/loop#troubleshooting. Query: "HINFO 2509125342931225420.4366682597458281349."
```







卸载网络插件：

```
kubectl delete -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

ifconfig cni0 down
ip link delete cni0
ifconfig flannel.1 down
ip link delete flannel.1
rm -rf /var/lib/cni/
rm -f /etc/cni/net.d/*
注：执行完上面的操作，重启kubelet

```



 使用weave插件:

```sh
kubectl apply -n kube-system -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
```





再次重置：

```sh
kubectl drain van-master --delete-local-data --force --ignore-daemonsets
kubectl delete node van-master
kubeadm reset
```



master节点安装了kubelet，默认情况下不参与工作负载，使master节点也参与workload：

```
kubectl taint node van-master node-role.kubernetes.io/master-
```





## 



```
kubeadm init --apiserver-advertise-address=192.168.177.130 --image-repository registry.aliyuncs.com/google_containers --kubernetes-version v1.18.0 --service-cidr=10.96.0.0/12  --pod-network-cidr=10.244.0.0/16
```








