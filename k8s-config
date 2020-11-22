
## update resource list:

### add source

cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb http://mirrors.ustc.edu.cn/kubernetes/apt kubernetes-xenial main
EOF

then:

```
apt-get update
```

for error:

```
GPG error: http://mirrors.ustc.edu.cn/kubernetes/apt kubernetes-xenial InRelease: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 6A030B21BA07F4FB
```

lack the public key add  key:

gpg --keyserver keyserver.ubuntu.com --recv-keys <last 8 bit of key>
gpg --export --armor <last 8 bit of key> | sudo apt-key add -

ref:
https://zhuanlan.zhihu.com/p/46341911
