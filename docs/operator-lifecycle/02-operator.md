### Abstract

An Operator is a way to package, run, and maintain a Kubernetes application

Operator builds on Kubernetes abstractions to **automate the entire lifecycle** of the software it manages

For developer, Operators make it easier to deploy and run the foundation services on which their apps depend

Operators provide a consistent way to distribute software on Kubernetes clusters and reduce support burdens by identifying and correcting application problems before the pager beeps.



### How Kubernetes Works

Kubernetes automates the lifecycle of a stateless application, such as a static web server. Without state, any instances of an application are interchangeable. This simple web server retrieves files and sends them on to a visitor’s browser. Because the server is not tracking state or storing input or data of any kind, when one server instance fails, Kubernetes can replace it with another. Kubernetes refers to these instances, each a copy of an application running on the cluster, as *replicas*.

A Kubernetes cluster is a collection of computers, called *nodes*. All cluster work runs on one, some, or all of a cluster’s nodes. The basic unit of work, and of replication, is the *pod*. A pod is a group of one or more Linux containers with common resources like networking, storage, and access to shared memory.

At a high level, a Kubernetes cluster can be divided into two planes. The *control plane* is, in simple terms, Kubernetes itself. A collection of pods comprises the control plane and implements the Kubernetes application programming interface (API) and cluster orchestration logic.

The *application plane*, or *data plane*, is everything else. It is the group of nodes where application pods run. One or more nodes are usually dedicated to running applications, while one or more nodes are often sequestered to run only control plane pods. As with application pods, multiple replicas of control plane components can run on multiple controller nodes to provide **redundancy**.

The *controllers* of the control plane implement control loops that repeatedly compare the desired state of the cluster to its actual state. When the two diverge, a controller takes action to make them match. Operators extend this behavior. The schematic in Figure 1-1 shows the major control plane components, with worker nodes running application workloads

![](https://tva1.sinaimg.cn/large/0081Kckwgy1glb6c62kjdj31020u0gou.jpg)

While a strict division between the control and application planes is a convenient mental model and a common way to deploy a Kubernetes cluster to segregate work‐loads, the control plane components are a collection of pods running on nodes, like any other application. In small clusters, control plane components are often sharing the same node or two with application workloads



The conceptual model of a cordoned control plane isn’t quite so tidy, either. The **kubelet** agent running on every node is part of the control plane, for example. Likewise, an Operator is a type of controller, usually thought of as a control plane component.**Operators can blur this distinct border between planes**, however. Treating the control and application planes as isolated domains is a helpful simplifying abstraction, not an absolute truth.



### Stateful Is Hard

...

### Operators Are Software SREs

Site Reliability Engineering (SRE) is a set of patterns and principles for running large systems. Originating at Google, SRE has had a pronounced influence on industry practice. Practitioners must interpret and apply SRE philosophy to particular circumstances, but a key tenet is automating systems administration by writing software to run your software. Teams freed from rote maintenance work have more time to create new features, fix bugs, and generally improve their products.



### How Operators Work

Operators work by extending the Kubernetes control plane and API. In its simplest form, an Operator adds an endpoint to the Kubernetes API, called a *custom resource* (CR), along with a control plane component that monitors and maintains resources of the new type. This Operator can then take action based on the resource’s state. This is illustrated in Figure 1-2

![](https://tva1.sinaimg.cn/large/0081Kckwgy1glb6mvxe1pj312e0tsn14.jpg)



### Kubernetes CRs

CRs are the API extension mechanism in Kubernetes. A *custom resource definition* (CRD) defines a CR;  it’s analogous to a schema for the CR data. Unlike members of the official API, a given CRD doesn’t exist on every Kubernetes cluster. CRDs extend the API of the particular cluster where they are defined. CRs provide endpoints for reading and writing structured data. A cluster user can interact with CRs with kubectl or another Kubernetes client, just like any other API resource.



Kubernetes compares a set of resources to reality; that is, the running state of the cluster. It takes actions to make reality match the desired state described by those resources. Operators extend that pattern to specific applications on specific clusters.**An Operator is a custom Kubernetes controller watching a CR type and taking application-specific actions to make reality match the spec in that resource**. Making an Operator means creating a CRD and providing a program that runs in a loop watching CRs of that kind. What the Operator does in response to changes in the CR is specific to the application the Operator manages. The actions an Operator performs can include almost anything: scaling a complex app, application version upgrades, or even managing kernel modules for nodes in a computational cluster with specialized hardware.



### Who Are Operators For?

The Operator pattern arose in response to infrastructure engineers and developers wanting to extend Kubernetes to provide features specific to their sites and software. **Operators make it easier for cluster administrators to enable**, and developers to use, foundation software pieces like databases and storage systems with less management overhead. If the “killernewdb” database server that’s perfect for your application’s backend has an Operator to manage it, you can deploy killernewdb without needing to become an expert killernewdb DBA.

Application developers build **Operators to manage the applications they are delivering, simplifying the deployment and management experience on their customer's Kubernetes clusters**. Infrastructure engineers create Operators to control deployed services and systems.



